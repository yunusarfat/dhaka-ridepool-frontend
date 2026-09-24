"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { getUser, clearAuth, AuthUser } from "@/lib/auth";

interface Ride {
  id: number;
  pickup: string;
  destination: string;
  seats_requested: number;
  status: string;
  estimated_fare: number;
  created_at: string;
}

const ZONES = [
  "Banani",
  "Gulshan",
  "Mohakhali",
  "Dhanmondi",
  "Mirpur",
  "Uttara",
  "Farmgate",
  "Bashundhara",
];

function formatFare(paisa: number) {
  return `৳${(paisa / 100).toFixed(0)}`;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    REQUESTED: "bg-yellow-100 text-yellow-800",
    MATCHED: "bg-blue-100 text-blue-800",
    DRIVER_ARRIVED: "bg-indigo-100 text-indigo-800",
    STARTED: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`rounded px-2 py-1 text-xs font-medium ${colors[status] || "bg-gray-100"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function PassengerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  const [pickup, setPickup] = useState("Banani");
  const [destination, setDestination] = useState("Mohakhali");
  const [seats, setSeats] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [rides, setRides] = useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = useState(true);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== "PASSENGER") {
      router.push("/login");
      return;
    }
    setUser(u);
    loadHistory();
  }, [router]);

  async function loadHistory() {
    setLoadingRides(true);
    try {
      const data = await apiRequest<Ride[]>("/api/rides/history");
      setRides(data);
    } catch (err) {
      // silent fail on background refresh
    } finally {
      setLoadingRides(false);
    }
  }

  async function handleRequestRide(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await apiRequest<Ride>("/api/rides", {
        method: "POST",
        body: { pickup, destination, seats },
      });
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not request ride");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(rideId: number) {
    try {
      await apiRequest(`/api/rides/${rideId}/cancel`, { method: "PATCH" });
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel ride");
    }
  }

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  if (!user) return null;

  const activeRide = rides.find((r) => !["COMPLETED", "CANCELLED"].includes(r.status));

  return (
    <div className="mx-auto max-w-2xl p-4">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Passenger Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome, {user.name}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 underline">
          Log out
        </button>
      </header>

      {error && <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      {activeRide ? (
        <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-2 font-medium">My Ride</h2>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-gray-500">Route:</span> {activeRide.pickup} → {activeRide.destination}
            </p>
            <p>
              <span className="text-gray-500">Status:</span> <StatusBadge status={activeRide.status} />
            </p>
            <p>
              <span className="text-gray-500">Fare:</span> {formatFare(activeRide.estimated_fare)}
            </p>
          </div>
          {activeRide.status === "REQUESTED" && (
            <button
              onClick={() => handleCancel(activeRide.id)}
              className="mt-3 rounded border border-red-300 px-3 py-1 text-sm text-red-700"
            >
              Cancel Ride
            </button>
          )}
        </section>
      ) : (
        <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 font-medium">Request a Ride</h2>
          <form onSubmit={handleRequestRide} className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Pickup</label>
              <select
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 p-2"
              >
                {ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Destination</label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 p-2"
              >
                {ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Seats</label>
              <input
                type="number"
                min={1}
                max={3}
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className="mt-1 w-full rounded border border-gray-300 p-2"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded bg-black p-2 text-white disabled:opacity-50"
            >
              {submitting ? "Requesting..." : "Request Ride"}
            </button>
          </form>
        </section>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-medium">Ride History</h2>
        {loadingRides ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : rides.length === 0 ? (
          <p className="text-sm text-gray-500">No rides yet.</p>
        ) : (
          <ul className="space-y-2">
            {rides.map((ride) => (
              <li key={ride.id} className="flex items-center justify-between border-b border-gray-100 pb-2 text-sm">
                <div>
                  <p>
                    {ride.pickup} → {ride.destination} ({ride.seats_requested} seat{ride.seats_requested > 1 ? "s" : ""})
                  </p>
                  <p className="text-gray-500">{formatFare(ride.estimated_fare)}</p>
                </div>
                <StatusBadge status={ride.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}