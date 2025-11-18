"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
    className?: string;
    onConfirm?: () => void;
};

export default function DeleteAccount({ className, onConfirm }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete() {
        const confirmed = window.confirm(
            "This will permanently delete your account and all associated data. Are you sure?"
        );
        if (!confirmed) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/delete-account", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                const msg = body?.message || `Request failed with status ${res.status}`;
                throw new Error(msg);
            }

            // Call optional callback from parent
            try {
                onConfirm && onConfirm();
            } catch (_) {}

            // After successful deletion, navigate away (e.g., home) and optionally reload.
            router.push("/");
        } catch (err: any) {
            setError(err?.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    }

    // If parent provided a className, use it; otherwise fall back to inline styles
    const inlineStyle = {
        backgroundColor: "#d32f2f",
        color: "white",
        padding: "8px 12px",
        border: "none",
        borderRadius: 4,
        cursor: loading ? "not-allowed" : "pointer",
    } as React.CSSProperties;

    return (
        <div>
            <button
                onClick={handleDelete}
                disabled={loading}
                className={className}
                style={className ? undefined : inlineStyle}
                aria-busy={loading}
                aria-disabled={loading}
            >
                {loading ? "Deleting..." : "Delete account"}
            </button>
            {error && (
                <p style={{ color: "red", marginTop: 8 }} role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}