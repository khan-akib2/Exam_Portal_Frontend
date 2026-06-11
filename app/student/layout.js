"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { RefreshCw } from "lucide-react";

export default function StudentLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!stored || !token) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(stored);
      if (user.role !== "student") {
        router.push("/login");
        return;
      }
      if (user.needsPasswordReset) {
        router.push("/login?forceReset=true");
        return;
      }
    } catch (e) {
      router.push("/login");
      return;
    }

    // Verify session and refresh token
    fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();

        if (data.user?.needsPasswordReset) {
          router.push("/login?forceReset=true");
          return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        // Sync Navbar
        window.dispatchEvent(new Event("storage"));
        setAuthorized(true);
      })
      .catch(() => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        window.dispatchEvent(new Event("storage"));
        router.push("/login");
      });
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
          <span className="text-sm font-semibold text-slate-600">Verifying session...</span>
        </div>
      </div>
    );
  }

  // If in the exam taking interface, render raw children (no nav/sidebar to prevent distractions)
  const isExamPage = pathname.includes("/student/exam/");

  if (isExamPage) {
    return <div className="flex min-h-screen flex-col bg-[#FAFBFC] text-slate-800">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 md:p-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
