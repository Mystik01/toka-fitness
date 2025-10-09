// lib/apiClient.ts
import dotenv from "dotenv";
dotenv.config();
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.API_URL ?? "http://localhost:5000") {
    this.baseUrl = baseUrl;
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
    return this.request("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string) {
    return this.request("/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async validateSession() {
    return this.request("/validate-session", { method: "GET" });
  }

  async getMe() {
    return this.request("/me", { method: "GET" });
  }

  async updateMe(data: Record<string, any>) {
    return this.request("/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }
}