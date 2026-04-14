"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error ?? "Login failed");
        return;
      }

      window.location.href = "/";
    } catch {
      setError("Network error, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#060d1d] p-4 text-slate-100">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-sky-400/30 bg-[#0b1b38] p-6 shadow-2xl"
      >
        <h1 className="mb-1 text-2xl font-bold text-sky-300">Tuition Tracker</h1>
        <p className="mb-5 text-sm text-slate-300">Sign in to continue</p>

        <label className="mb-3 block text-sm">
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-1 w-full rounded-lg border border-sky-400/30 bg-[#091226] p-2"
            required
          />
        </label>

        <label className="mb-4 block text-sm">
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            className="mt-1 w-full rounded-lg border border-sky-400/30 bg-[#091226] p-2"
            required
          />
        </label>

        {error ? <p className="mb-4 rounded bg-rose-500/20 p-2 text-sm text-rose-200">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-sky-500 px-4 py-2 font-semibold text-slate-900 hover:bg-sky-400 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </main>
  );
}
