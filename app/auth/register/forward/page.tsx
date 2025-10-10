import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

interface ForwardPageProps {
    searchParams: { token?: string };
}

export default function ForwardPage({ searchParams }: ForwardPageProps) {
    const router = useRouter();
    const { token } = searchParams;

    useEffect(() => {
        if (token && SUPABASE_URL) {
            const redirectUrl = `${SUPABASE_URL}/auth/v1/verify?token=${encodeURIComponent(token)}`;
            router.replace(redirectUrl);
        }
    }, [token, router]);

    return (
        <div>
            Redirecting to email verification...
        </div>
    );
}