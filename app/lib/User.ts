export interface User {
  id: string;
  email: string;
  phone?: string;
  displayName?: string;
  user_metadata?: Record<string, any>;
}

export async function getMe(): Promise<User> {
  const res = await fetch("/api/me", {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json() as Promise<User>;
}

export async function updateMe(data: { email?: string; password?: string }): Promise<User> {
  const res = await fetch("/api/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to update profile");
  return res.json() as Promise<User>;
}