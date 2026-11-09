"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  passwordsMatch,
  safeNextPath,
  sessionCookieOptions,
  signSession,
} from "@/lib/auth";
import { hasValidSession } from "@/lib/session";

export async function login(formData: FormData) {
  const expected = process.env.SITE_PASSWORD;
  const nextPath = safeNextPath(formData.get("next")?.toString());
  if (!expected) {
    redirect("/login?error=config");
  }

  const password = formData.get("password")?.toString() ?? "";
  if (!passwordsMatch(password, expected)) {
    const params = new URLSearchParams({ error: "invalid" });
    if (nextPath !== "/") params.set("next", nextPath);
    redirect(`/login?${params.toString()}`);
  }

  const jar = await cookies();
  jar.set(
    SESSION_COOKIE,
    signSession(expected, Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
    sessionCookieOptions(),
  );
  redirect(nextPath);
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function refreshBoard() {
  if (!(await hasValidSession())) redirect("/login");
  updateTag("linear-board");
}
