"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/auth";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    const result = await login(userId, password);
    if (result.success) {
      router.push("/image");
    } else {
      setError(result.error || "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 md:p-8 rounded shadow-md w-full max-w-sm"
      >
        <h1 className="text-xl font-bold mb-6 text-center text-black">
          AI Generator Login
        </h1>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">
            User ID
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-black"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-black"
          />
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          disabled={loading || !userId.trim() || !password.trim()}
          className="w-full bg-blue-600 text-white py-2 rounded text-sm disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
