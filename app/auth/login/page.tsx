"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { login, validateSession } from "@/app/lib/auth"; // ✅ use wrapper
import { getApiUrl } from "@/app/lib/apiClient";
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
  const notice = searchParams.get('notice');
  const [classSummary, setClassSummary] = useState<{
    name: string;
    instructor: string;
    start: string;
    end?: string;
    isPast: boolean;
    type?: string;
    emoji?: string;
  } | null>(null);
  const [classSummaryLoading, setClassSummaryLoading] = useState(false);
  const [staffMap, setStaffMap] = useState<Record<string, string>>({});

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

  // Fetch class details (lightweight) for shared class notice
  useEffect(() => {
    const redirectTo = searchParams.get('redirect');
    const noticeParam = searchParams.get('notice');
    if (noticeParam !== 'signin_required_for_class' || !redirectTo) return;

    // Extract class id from redirect query (?class=ID)
    let classId: string | null = null;
    try {
      const url = new URL(redirectTo, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
      classId = url.searchParams.get('class');
    } catch (e) {
      // ignore
    }
    if (!classId) return;

    const getClassEmoji = (classType?: string) => {
      const type = (classType || '').toLowerCase();
      switch (type) {
        case 'yoga':
          return '🧘';
        case 'hiit':
          return '💪';
        case 'spin':
          return '🚴';
        case 'pilates':
          return '🧘‍♀️';
        case 'boxing':
          return '🥊';
        case 'strength':
          return '🏋️';
        case 'dance':
          return '💃';
        case 'swimming':
          return '🏊';
        default:
          return '🎟️';
      }
    };

    const loadClass = async () => {
      try {
        setClassSummaryLoading(true);
        const fetchStaffUsers = async () => {
          if (Object.keys(staffMap).length > 0) return staffMap;
          try {
            const staffRes = await fetch(`${getApiUrl()}/api/staff-users`);
            const staffData = await staffRes.json();
            if (staffRes.ok && Array.isArray(staffData.staff_users)) {
              const map: Record<string, string> = {};
              staffData.staff_users.forEach((u: any) => {
                if (u?.id) {
                  map[u.id] = u.name || u.email || u.id;
                }
              });
              setStaffMap(map);
              return map;
            }
          } catch (e) {
            // ignore mapping errors
          }
          return staffMap;
        };

        const [classRes, staffMapResult] = await Promise.all([
          fetch(`${getApiUrl()}/api/classes`),
          fetchStaffUsers(),
        ]);

        const data = await classRes.json();
        if (!classRes.ok || !Array.isArray(data.classes)) return;
        const found = data.classes.find((c: any) => String(c.id) === String(classId));
        if (!found) return;

        const start = found.start;
        const end = found.end;
        const startDate = start ? new Date(start) : null;
        const isPast = startDate ? startDate.getTime() < Date.now() : false;
        const instructorId = found.instructor;
        const instructorDisplay = staffMapResult?.[instructorId] || found.instructor_name || instructorId || 'Instructor';
        setClassSummary({
          name: found.class_name || 'Class',
          instructor: instructorDisplay,
          start,
          end,
          isPast,
          type: found.class_type,
          emoji: getClassEmoji(found.class_type),
        });
      } catch (e) {
        // silent fail
      } finally {
        setClassSummaryLoading(false);
      }
    };

    loadClass();
  }, [searchParams]);

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
      
      // Get redirect parameter from URL, default to /dashboard
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      router.push(redirectTo);
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
    <div className="space-y-4 sm:space-y-6">
      {notice === 'signin_required_for_class' && (
        <div className="p-4 rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 via-orange-50 to-white shadow-sm text-sm text-amber-900">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-10 w-10 rounded-full bg-white text-2xl flex items-center justify-center shadow-inner">{classSummary?.emoji || '🎟️'}</div>
            <div className="flex-1 space-y-2">
              <p className="font-semibold text-amber-900">You've been invited to join a class!</p>
              {classSummaryLoading && <p className="text-amber-800">Loading class details...</p>}
              {!classSummaryLoading && classSummary && (
                <div className="space-y-1.5">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="px-2.5 py-1 rounded-full bg-white border border-amber-200 text-amber-900 text-xs font-semibold">{classSummary.name}</span>
                    <span className="px-2.5 py-1 rounded-full bg-white border border-amber-100 text-amber-800 text-xs">Instructor: {classSummary.instructor}</span>
                  </div>
                  <p className="text-amber-900">
                    <span className="font-semibold">Starts:</span> {classSummary.start ? new Date(classSummary.start).toLocaleString() : 'TBD'}
                    {classSummary.end && (
                      <>
                        {' '}<span className="font-semibold">Ends:</span> {new Date(classSummary.end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </>
                    )}
                  </p>
                  {classSummary.isPast && (
                    <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold">
                      Already happened — you can still sign in to explore other classes.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Sign in
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Welcome back! Please enter your credentials.
        </p>
      </div>

      <form className="space-y-4 sm:space-y-5 pt-2" onSubmit={handleSubmit}>
        <div className="space-y-4 sm:space-y-5">
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

        <div className="pt-2 sm:pt-4">
          <button
            type="submit"
            disabled={loading || (!!error && !hasFormChanged)}
            className="w-full py-3 sm:py-4 px-4 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? "Signing in..." : error && !hasFormChanged ? "Please modify your input" : "Sign in"}
          </button>
        </div>
      </form>

      <div className="text-center pt-2 sm:pt-4">
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

      <div className="text-center pt-4 sm:pt-6">
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