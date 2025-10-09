// pages/auth/callback.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.substring(1); // remove #
      const params = new URLSearchParams(hash);

      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const expiresIn = params.get("expires_in");

      if (accessToken && refreshToken) {
        // Save to localStorage (or use cookies if you prefer httpOnly)
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        localStorage.setItem("expires_in", expiresIn || "");

        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        // No tokens? Send them to login
        router.push("/login");
      }
    }
  }, [router]);

  return <p>Processing login...</p>;
}