"use client";

import { signOut } from "@/app/lib/auth";
import { useRouter } from "next/navigation";

interface SignOutButtonProps {
  className?: string;
}

export default function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/auth/login");
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ${className || ""}`}
    >
      Sign Out
    </button>
  );
}