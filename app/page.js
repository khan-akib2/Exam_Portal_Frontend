"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!stored || !token) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(stored);
      if (user.role === "super_admin") {
        router.push("/superadmin");
      } else if (user.role === "admin") {
        router.push("/admin");
      } else if (user.role === "student") {
        router.push("/student");
      } else {
        router.push("/login");
      }
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
        <span className="text-sm font-semibold text-slate-600">Loading Medical Portal...</span>
      </div>
    </div>
  );
}
