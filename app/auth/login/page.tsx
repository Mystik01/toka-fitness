"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { login, validateSession } from "@/app/lib/auth"; // ✅ use wrapper
import { Eye, EyeOff } from "lucide-react";
import AlreadyLoggedIn from "@/app/components/AlreadyLoggedIn";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Track form state for preventing resubmission
  const [lastSubmittedEmail, setLastSubmittedEmail] = useState("");
  const [lastSubmittedPassword, setLastSubmittedPassword] = useState("");
  const [hasFormChanged, setHasFormChanged] = useState(false);
  
  // Track failed login attempts
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const userData = await validateSession();
        setUser(userData.user);
      } catch (err) {
        // User is not authenticated, show login form
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthentication();
    
    // Check for email parameter from URL only once
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, []); // Remove searchParams from dependencies

  // Separate useEffect for form change tracking to prevent conflicts
  useEffect(() => {
    if (error && (email !== lastSubmittedEmail || password !== lastSubmittedPassword)) {
      setHasFormChanged(true);
      setError(""); // Clear error when user makes changes
    } else if (!error && (email || password)) {
      setHasFormChanged(true);
    }
  }, [email, password, lastSubmittedEmail, lastSubmittedPassword, error]);

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-100 sm:flex sm:items-center sm:justify-center sm:p-4">
        <div className="min-h-screen sm:min-h-0 w-full max-w-md bg-white sm:rounded-lg sm:shadow-md p-6 sm:p-8 flex flex-col justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show already logged in component if user is authenticated
  if (user) {
    return <AlreadyLoggedIn user={user} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent resubmission if form hasn't changed after an error
    if (error && !hasFormChanged) {
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const data = await login(email, password); // ✅ wrapper call
      console.log("Login response:", data);

      // Reset failed attempts on successful login
      setFailedAttempts(0);
      setSuccess(true);
      router.push("/dashboard"); // redirect on success
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Login failed");
      
      // Increment failed attempts
      setFailedAttempts(prev => prev + 1);
      
      // Store the values that caused the error
      setLastSubmittedEmail(email);
      setLastSubmittedPassword(password);
      setHasFormChanged(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-3 text-sm text-gray-600">
          Welcome back! Please enter your credentials.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <label
              htmlFor="email-address"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              required
              className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                className="text-black w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              
              {/* Eye icon inside input */}
              <button
                type="button"
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1} // prevent tab focus
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-md">
            Login successful!
          </div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || (!!error && !hasFormChanged)}
            className="w-full py-4 px-4 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? "Signing in..." : error && !hasFormChanged ? "Please modify your input" : "Sign in"}
          </button>
        </div>
      </form>

      <div className="text-center pt-4">
        {failedAttempts >= 3 ? (
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-100 rounded-lg animate-pulse"></div>
            <Link
              href={`/auth/forgot?email=${encodeURIComponent(email)}`}
              className="relative inline-block px-4 py-2 text-sm font-bold text-yellow-800 bg-yellow-200 hover:bg-yellow-300 rounded-lg border-2 border-yellow-400 transition-all duration-200 transform hover:scale-105"
            >
              🔑 Need help? Reset your password here
            </Link>
          </div>
        ) : (
          <Link
            href="/auth/forgot"
            className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
          >
            Forgot your password?
          </Link>
        )}
      </div>

      <div className="text-center pt-6">
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-indigo-600 hover:text-indigo-500 underline"
          >
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}