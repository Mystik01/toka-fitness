"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PasswordStrength from "@/app/ui/auth/PasswordStrength";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Mail, Smartphone, CheckCircle, ArrowRight } from "lucide-react";
import { register, validateSession, verifyEmail } from "@/app/lib/auth";
import AlreadyLoggedIn from "@/app/components/AlreadyLoggedIn";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Track form state for preventing resubmission
  const [lastSubmittedEmail, setLastSubmittedEmail] = useState("");
  const [lastSubmittedPassword, setLastSubmittedPassword] = useState("");
  const [lastSubmittedConfirmPassword, setLastSubmittedConfirmPassword] = useState("");
  const [hasFormChanged, setHasFormChanged] = useState(false);
  
  // Auto-redirect state for existing email
  const [redirecting, setRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Email verification states
  const [showVerification, setShowVerification] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'code' | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const userData = await validateSession();
        setUser(userData.user);
      } catch (err) {
        // User is not authenticated, show register form
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, []);

  // Listen for email verification messages from callback page
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'EMAIL_VERIFIED' && event.data.success) {
        // Email was verified in another tab, redirect to dashboard
        router.push('/dashboard');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router]);

  // Track form changes to enable/disable submit - optimize condition
  useEffect(() => {
    if (error && (email !== lastSubmittedEmail || password !== lastSubmittedPassword || confirmPassword !== lastSubmittedConfirmPassword)) {
      setHasFormChanged(true);
      setError(""); // Clear error when user makes changes
      setMessage(""); // Clear message when user makes changes
    } else if (!error && (email || password || confirmPassword)) {
      setHasFormChanged(true);
    }
  }, [email, password, confirmPassword, lastSubmittedEmail, lastSubmittedPassword, lastSubmittedConfirmPassword, error]);

  // Handle countdown and redirect for existing email - optimize dependencies
  useEffect(() => {
    if (!redirecting) return; // Early return if not redirecting
    
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Redirect to login with email prefilled
      router.push(`/auth/login?email=${encodeURIComponent(email)}`);
    }
  }, [redirecting, countdown, router, email]);

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
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLastSubmittedEmail(email);
      setLastSubmittedPassword(password);
      setLastSubmittedConfirmPassword(confirmPassword);
      setHasFormChanged(false);
      setLoading(false);
      return;
    }

    try {
      const data = await register(email, password);

      // Show verification options instead of just success message
      setRegisteredEmail(email);
      setShowVerification(true);
      setSuccess(true);
      setMessage(
        data.message ||
          "Registration successful! Please verify your email to continue."
      );
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const errorMessage = err.message || "Network error. Please try again.";
      
      // Check if error is about existing email
      if (errorMessage.includes("already have an account") || 
          errorMessage.includes("already exists") || 
          errorMessage.includes("already registered")) {
        setError("Looks like you already have an account");
        setRedirecting(true);
        setCountdown(5);
        return; // Don't set the form tracking values for redirect case
      }
      
      setError(errorMessage);
      // Store the values that caused the error
      setLastSubmittedEmail(email);
      setLastSubmittedPassword(password);
      setLastSubmittedConfirmPassword(confirmPassword);
      setHasFormChanged(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError("Please enter a valid 6-digit code");
      return;
    }

    setVerificationLoading(true);
    setVerificationError("");

    try {
      const result = await verifyEmail(registeredEmail, verificationCode);
      if (result.success) {
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setVerificationError(result.error || "Invalid verification code");
      }
    } catch (error) {
      setVerificationError("Failed to verify code. Please try again.");
    } finally {
      setVerificationLoading(false);
    }
  };

  const openEmailVerification = () => {
    const verificationUrl = `/auth/callback?verify=true&email=${encodeURIComponent(registeredEmail)}`;
    window.open(verificationUrl, '_blank', 'width=500,height=600');
  };

  // Show verification options if registration was successful
  if (showVerification) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
          >
            <CheckCircle className="w-8 h-8 text-green-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-3 text-sm text-gray-600">
            We've sent a verification email to <strong>{registeredEmail}</strong>
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Choose how you'd like to verify your email:
          </p>

          {/* Email Link Option */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all"
            onClick={() => setVerificationMethod('email')}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">
                  Click the link in your email
                </h3>
                <p className="text-xs text-gray-500">
                  Check your inbox and click the verification link
                </p>
              </div>
              {verificationMethod === 'email' && (
                <ArrowRight className="w-4 h-4 text-blue-600" />
              )}
            </div>
            
            {verificationMethod === 'email' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <p className="text-xs text-gray-600 mb-3">
                  Can't find the email? Check your spam folder or click below to open it in a new tab:
                </p>
                <button
                  onClick={openEmailVerification}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Open Email Verification
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* Code Input Option */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all"
            onClick={() => setVerificationMethod('code')}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Smartphone className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">
                  Enter verification code
                </h3>
                <p className="text-xs text-gray-500">
                  Enter the 6-digit code from your email
                </p>
              </div>
              {verificationMethod === 'code' && (
                <ArrowRight className="w-4 h-4 text-blue-600" />
              )}
            </div>

            {verificationMethod === 'code' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <form onSubmit={handleCodeVerification} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setVerificationCode(value);
                      setVerificationError("");
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-lg font-mono tracking-widest focus:ring-blue-500 focus:border-blue-500"
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                  {verificationError && (
                    <p className="text-sm text-red-600 text-center">{verificationError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={verificationLoading || verificationCode.length !== 6}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {verificationLoading ? "Verifying..." : "Verify Code"}
                  </button>
                </form>
              </motion.div>
            )}
          </motion.div>
        </div>

        <div className="text-center pt-4">
          <button
            onClick={() => {
              setShowVerification(false);
              setVerificationMethod(null);
              setVerificationCode("");
              setVerificationError("");
            }}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            ← Back to registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Create account
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Join us today! Fill in your details below.
        </p>
      </div>

      <form className="space-y-4 sm:space-y-5 pt-2" onSubmit={handleSubmit}>
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black placeholder-gray-400"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        {/* Password */}
        {/* Password */}
        <div className="relative w-full">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>

          {/* Input and eye icon container */}
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-black"
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
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              tabIndex={-1} // prevent tab focus
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Password strength meter */}
          <AnimatePresence>
            {password.length > 0 && (
              <motion.div
                key="strength-meter"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="mt-2"
              >
                <PasswordStrength password={password} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirm Password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {/* Errors / Success */}
        {error && (
          <div className={`text-sm text-center p-3 rounded-md ${
            redirecting 
              ? "text-blue-600 bg-blue-50 border border-blue-200" 
              : "text-red-600 bg-red-50"
          }`}>
            {redirecting ? (
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{error}</span>
                </div>
                <p>Redirecting to login in {countdown} second{countdown !== 1 ? 's' : ''}...</p>
              </div>
            ) : (
              error
            )}
          </div>
        )}
        {success && (
          <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-md">
            {message}
          </div>
        )}

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || (!!error && !hasFormChanged)}
            className="w-full py-4 px-4 rounded-lg text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? "Creating account..." : error && !hasFormChanged ? "Please modify your input" : "Create account"}
          </button>
        </div>
      </form>

      <div className="text-center pt-4">
        <Link
          href="/auth/forgot"
          className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
        >
          Forgot your password?
        </Link>
      </div>

      <div className="text-center pt-6">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-indigo-600 hover:text-indigo-500 underline"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
