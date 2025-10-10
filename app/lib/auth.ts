// lib/auth.ts

// Get the correct API URL based on environment
function getApiUrl(): string {
  // In production/Vercel, use relative URLs since Flask is at /api/*
  if (typeof window !== 'undefined') {
    // Client-side
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_VERCEL_ENV) {
      return ''; // Relative URLs work on Vercel
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5328';
  } else {
    // Server-side
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      return ''; // Relative URLs work on Vercel
    }
    return process.env.API_URL || 'http://localhost:5328';
  }
}

// Helper function to format error messages for better UX
function formatAuthError(errorMessage: string): string {
  const message = errorMessage.toLowerCase();
  
  // Login specific errors
  if (message.includes('invalid login credentials') || message.includes('invalid_credentials')) {
    return "Invalid email or password";
  }
  if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) {
    return "Please verify your email before signing in";
  }
  if (message.includes('too many requests') || message.includes('rate limit')) {
    return "Too many login attempts. Please try again later";
  }
  if (message.includes('user not found') || message.includes('user_not_found')) {
    return "No account found with this email address";
  }
  
  // Registration specific errors
  if (message.includes('already registered') || message.includes('already exists') || message.includes('user_already_exists')) {
    return "An account with this email already exists";
  }
  if (message.includes('invalid email') || message.includes('invalid_email')) {
    return "Please enter a valid email address";
  }
  if (message.includes('weak password') || message.includes('password') && message.includes('weak')) {
    return "Password is too weak. Please choose a stronger password";
  }
  if (message.includes('signup_disabled')) {
    return "User registration is currently disabled";
  }
  
  // Password reset specific errors
  if (message.includes('invalid email format')) {
    return "Please enter a valid email address";
  }
  if (message.includes('user not found') && message.includes('reset')) {
    return "No account found with this email address";
  }
  if (message.includes('failed to send reset email')) {
    return "Unable to send reset email. Please try again";
  }
  if (message.includes('invalid or expired reset token')) {
    return "Reset link has expired. Please request a new password reset";
  }
  if (message.includes('failed to update password')) {
    return "Failed to update password. Please try again";
  }
  
  // Session/token errors
  if (message.includes('invalid_token') || message.includes('jwt')) {
    return "Your session has expired. Please sign in again";
  }
  if (message.includes('expired')) {
    return "Your session has expired. Please sign in again";
  }
  
  // Return original message if no specific formatting needed
  return errorMessage;
}

export async function login(email: string, password: string) {
  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Important for cookies
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    const errorMessage = errorData.error || "Login failed";
    throw new Error(formatAuthError(errorMessage));
  }
  return res.json();
}

export async function register(email: string, password: string) {
  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Important for cookies
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    const errorMessage = errorData.error || "Registration failed";
    throw new Error(formatAuthError(errorMessage));
  }
  return res.json();
}

export async function validateSession() {
  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/api/validate-session`, {
    method: "GET",
    credentials: "include", // important for cookies
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Session validation failed" }));
    const errorMessage = errorData.error || "Not logged in";
    throw new Error(formatAuthError(errorMessage));
  }
  return res.json();
}

export async function signOut() {
  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/api/logout`, {
    method: "POST",
    credentials: "include", // important for cookies
  });
    
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Logout failed" }));
    const errorMessage = errorData.error || "Logout failed";
    throw new Error(formatAuthError(errorMessage));
  }
  return res.json();
}

// Get user data without validation (assumes user is already authenticated)
export async function getUserData() {
  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/api/me`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Failed to get user data" }));
    const errorMessage = errorData.error || "Failed to get user data";
    throw new Error(formatAuthError(errorMessage));
  }
  return res.json();
}

export async function forgotPassword(email: string) {
  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/api/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Failed to send reset email" }));
    const errorMessage = errorData.error || "Failed to send reset email";
    throw new Error(formatAuthError(errorMessage));
  }
  return res.json();
}

export async function resetPassword(accessToken: string, refreshToken: string, newPassword: string) {
  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/api/update-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
      password: newPassword,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Failed to update password" }));
    const errorMessage = errorData.error || "Failed to update password";
    throw new Error(formatAuthError(errorMessage));
  }
  return res.json();
}

// Verify email with 6-digit code
export async function verifyEmail(email: string, code: string) {
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/api/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email,
        token: code,
        type: "signup"
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Failed to verify email" }));
      const errorMessage = errorData.error || "Failed to verify email";
      return { success: false, error: formatAuthError(errorMessage) };
    }

    const data = await res.json();
    return { success: true, user: data.user };
  } catch (error) {
    console.error("Email verification error:", error);
    return { success: false, error: "Failed to verify email. Please try again." };
  }
}

// Handle email verification callback from link
export async function verifyCallback(accessToken: string, refreshToken: string) {
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/api/verify-callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Failed to verify email" }));
      const errorMessage = errorData.error || "Failed to verify email";
      return { success: false, error: formatAuthError(errorMessage) };
    }

    const data = await res.json();
    return { success: true, user: data.user };
  } catch (error) {
    console.error("Email verification callback error:", error);
    return { success: false, error: "Failed to verify email. Please try again." };
  }
}
