import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "./auth";

export async function hasValidSession(): Promise<boolean> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value, process.env.SITE_PASSWORD);
}
