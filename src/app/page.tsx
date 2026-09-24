"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push("/login");
    } else if (user.role === "DRIVER") {
      router.push("/driver");
    } else {
      router.push("/passenger");
    }
  }, [router]);

  return <div className="p-8 text-center">Loading...</div>;
}