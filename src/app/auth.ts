"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(userId: string, password: string) {
  const validUserId = process.env.APP_USER_ID;
  const validPassword = process.env.APP_PASSWORD;

  console.log("[Auth] Login attempt for user:", userId);

  if (userId === validUserId && password === validPassword) {
    console.log("[Auth] Login successful");
    const cookieStore = await cookies();
    cookieStore.set("session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });
    return { success: true };
  }

  console.log("[Auth] Login failed — invalid credentials");
  return { success: false, error: "Invalid user ID or password" };
}

export async function logout() {
  console.log("[Auth] Logging out");
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}
