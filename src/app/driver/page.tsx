"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { getUser, clearAuth, AuthUser } from "@/lib/auth";

interface Vehicle {
  id: number;
  name: string;
  capacity: number;
  status: "ONLINE" | "OFFLINE";
}

interface PoolMember {
  id: number;
  fare: number;
  ride_request: {
    id: number;
    pickup: string;
    destination: string;
    seats_requested: number;
    status: string;
    passenger: { id: number; name: string; email: string };
  };
}

interface Pool {
  id: number;
  status: string;
  vehicle: Vehicle;
  members: PoolMember[];
}

function formatFare(paisa: number) {
  return `৳${(paisa / 100).toFixed(0)}`;
}

const NEXT_ACTION: Record<string, { label: string; endpoint: string } | null> = {
  MATCHED: { label: "Mark Driver Arrived", endpoint: "arrived" },
  DRIVER_ARRIVED: { label: "Start Trip", endpoint: "start" },
  STARTED: { label: "Complete Trip", endpoint: "complete" },
  COMPLETED: null,
  CANCELLED: null,
};

export default function DriverDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [vehicleError, setVehicleError] = useState("");
  const [creatingVehicle, setCreatingVehicle] = useState(false);
  const [vehicleName, setVehicleName] = useState("Bullet");
  const [capacity, setCapacity] = useState(3);

  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== "DRIVER") {
      router.push("/login");
      return;
    }
    setUser(u);
    loadAll();
  }, [router]);

  async function loadAll() {
    setLoading(true);
    try {
      const v = await apiRequest<Vehicle>("/api/vehicles/me");
      setVehicle(v);
    } catch {
      setVehicle(null);
    }

    try {
      const p = await apiRequest<Pool | null>("/api/pools/active");
      setPool(p);
    } catch {
      setPool(null);
    }
    setLoading(false);
  }

  async function handleCreateVehicle(e: React.FormEvent) {
    e.preventDefault();
    setVehicleError("");
    setCreatingVehicle(true);
    try {
      const v = await apiRequest<Vehicle>("/api/vehicles", {
        method: "POST",
        body: { name: vehicleName, capacity },
      });
      setVehicle(v);
    } catch (err) {
      setVehicleError(err instanceof Error ? err.message : "Could not create vehicle");
    } finally {
      setCreatingVehicle(false);
    }
  }

  async function handleToggleStatus() {
    if (!vehicle) return;
    const nextStatus = vehicle.status === "ONLINE" ? "OFFLINE" : "ONLINE";
    try {
      const updated = await apiRequest<Vehicle>("/api/vehicles/status", {
        method: "PATCH",
        body: { status: nextStatus },
      });
      setVehicle(updated);
    } catch (err) {
      setVehicleError(err instanceof Error ? err.message : "Could not update status");
    }
  }

  async function handleNextStage() {
    if (!pool) return;
    const action = NEXT_ACTION[pool.status];
    if (!action) return;

    setActionLoading(true);
    setActionError("");
    try {
      await apiRequest(`/api/pools/${pool.id}/${action.endpoint}`, { method: "PATCH" });
      await loadAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update ride stage");
    } finally {
      setActionLoading(false);
    }
  }

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  if (!user) return null;

  const occupiedSeats = pool?.members.reduce((sum, m) => sum + m.ride_request.seats_requested, 0) ?? 0;

  return (
    <div className="mx-auto max-w-2xl p-4">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Driver Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome, {user.name}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 underline">
          Log out
        </button>
      </header>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : !vehicle ? (
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 font-medium">Register Your Vehicle</h2>
          {vehicleError && <p className="mb-2 rounded bg-red-50 p-2 text-sm text-red-700">{vehicleError}</p>}
          <form onSubmit={handleCreateVehicle} className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Vehicle Name</label>
              <input
                type="text"
                required
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Capacity</label>
              <input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="mt-1 w-full rounded border border-gray-300 p-2"
              />
            </div>
            <button
              type="submit"
              disabled={creatingVehicle}
              className="w-full rounded bg-black p-2 text-white disabled:opacity-50"
            >
              {creatingVehicle ? "Creating..." : "Create Vehicle"}
            </button>
          </form>
        </section>
      ) : (
        <>
          <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-medium">{vehicle.name}</h2>
                <p className="text-sm text-gray-500">
                  Capacity: {occupiedSeats}/{vehicle.capacity} occupied
                </p>
              </div>
              <button
                onClick={handleToggleStatus}
                className={`rounded px-3 py-1 text-sm font-medium ${
                  vehicle.status === "ONLINE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                }`}
              >
                {vehicle.status === "ONLINE" ? "Online (tap to go offline)" : "Offline (tap to go online)"}
              </button>
            </div>
            {vehicleError && <p className="mt-2 rounded bg-red-50 p-2 text-sm text-red-700">{vehicleError}</p>}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 font-medium">Current Ride</h2>
            {actionError && <p className="mb-2 rounded bg-red-50 p-2 text-sm text-red-700">{actionError}</p>}

            {!pool ? (
              <p className="text-sm text-gray-500">No active ride right now.</p>
            ) : (
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600">Stage: {pool.status.replace("_", " ")}</p>

                <ul className="mb-4 space-y-2">
                  {pool.members.map((m) => (
                    <li key={m.id} className="border-b border-gray-100 pb-2 text-sm">
                      <p className="font-medium">{m.ride_request.passenger.name}</p>
                      <p className="text-gray-500">
                        {m.ride_request.pickup} → {m.ride_request.destination} · {m.ride_request.seats_requested} seat
                        {m.ride_request.seats_requested > 1 ? "s" : ""} · {formatFare(m.fare)}
                      </p>
                    </li>
                  ))}
                </ul>

                {NEXT_ACTION[pool.status] && (
                  <button
                    onClick={handleNextStage}
                    disabled={actionLoading}
                    className="w-full rounded bg-black p-2 text-white disabled:opacity-50"
                  >
                    {actionLoading ? "Updating..." : NEXT_ACTION[pool.status]!.label}
                  </button>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}