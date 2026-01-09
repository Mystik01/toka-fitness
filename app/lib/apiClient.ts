// lib/apiClient.ts

// Get the correct API URL based on environment
export function getApiUrl(): string {
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

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getApiUrl();
  }

  private async request(endpoint: string, options?: RequestInit) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      credentials: "include", // 🔑 send cookies (your session token)
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }
    return res.json();
  }

  // 🔹 Auth endpoints
  async login(email: string, password: string) {
    return this.request("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string) {
    return this.request("/api/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async validateSession() {
    return this.request("/api/validate-session", { method: "GET" });
  }

  async getMe() {
    return this.request("/api/me", { method: "GET" });
  }

  async updateMe(data: Record<string, any>) {
    return this.request("/api/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }
}