"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { forgotPassword } from "@/app/lib/auth";

export default function Forgot() {
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [emailSent, setEmailSent] = useState(false);
    const [isPrefilledEmail, setIsPrefilledEmail] = useState(false);

    // Check for email parameter from URL
    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
            setIsPrefilledEmail(true);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const data = await forgotPassword(email);
            setEmailSent(true);
            setMessage(data.message || "Password reset email sent! Check your inbox.");
        } catch (err: any) {
            setError(err.message || "Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                        Check Your Email
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600">
                        We've sent a password reset link to <strong>{email}</strong>
                    </p>
                </div>

                <div className="space-y-4">
                    <p className="text-xs sm:text-sm text-gray-500 text-center">
                        Didn't receive the email? Check your spam folder or try again.
                    </p>
                    
                    <div className="flex flex-col space-y-3">
                        <button
                            onClick={() => {
                                setEmailSent(false);
                                setMessage("");
                                setEmail("");
                            }}
                            className="w-full py-3 px-4 border border-gray-300 rounded-lg text-sm sm:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        >
                            Try Different Email
                        </button>
                        
                        <Link
                            href="/auth/login"
                            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors text-center"
                        >
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Reset Your Password
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-gray-600">
                    {isPrefilledEmail 
                        ? "We've prefilled your email address. Click 'Send Reset Link' to confirm."
                        : "Enter your email address and we'll send you a link to reset your password"
                    }
                </p>
            </div>

            {isPrefilledEmail && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-blue-700">
                                Having trouble logging in? We've prefilled your email to help you reset your password.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            placeholder="Enter your email address"
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs sm:text-sm text-red-600">{error}</p>
                    </div>
                )}

                {message && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs sm:text-sm text-green-600">{message}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-4 bg-indigo-600 text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending Reset Link...
                        </div>
                    ) : (
                        "Send Reset Link"
                    )}
                </button>
            </form>

            <div className="text-center pt-4">
                <Link
                    href="/auth/login"
                    className="inline-flex items-center text-xs sm:text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
                >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Login
                </Link>
            </div>

            <div className="text-center pt-2">
                <p className="text-xs sm:text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Link
                        href="/auth/register"
                        className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                    >
                        Sign up here
                    </Link>
                </p>
            </div>
        </div>
    );
}