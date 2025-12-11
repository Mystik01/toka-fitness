export interface User {
  id: string;
  email: string;
  phone?: string;
  displayName?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    display_name?: string;
    role?: string;
    [key: string]: any;
  };
}

export async function getMe(): Promise<User> {
  const res = await fetch("/api/me", {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json() as Promise<User>;
}

export async function updateMe(data: { 
  email?: string; 
  password?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
}): Promise<User> {
  const res = await fetch("/api/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to update profile" }));
    throw new Error(error.error || "Failed to update profile");
  }
  return res.json() as Promise<User>;
}