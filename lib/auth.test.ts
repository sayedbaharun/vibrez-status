import { describe, expect, it } from "vitest";
import {
  passwordsMatch,
  safeNextPath,
  signSession,
  verifySession,
} from "./auth";

describe("session cookie", () => {
  const secret = "board-secret";
  const now = Date.parse("2026-11-09T12:00:00Z");

  it("accepts a token it just signed", () => {
    const token = signSession(secret, now + 60_000);
    expect(verifySession(token, secret, now)).toBe(true);
  });

  it("rejects a tampered signature, a wrong secret, and an expired token", () => {
    const token = signSession(secret, now + 60_000);
    const [payload, sig] = token.split(".");
    expect(verifySession(`${payload}.${sig.slice(0, -1)}x`, secret, now)).toBe(
      false,
    );
    expect(verifySession(token, "other-secret", now)).toBe(false);
    expect(verifySession(signSession(secret, now - 1), secret, now)).toBe(
      false,
    );
    expect(verifySession(undefined, secret, now)).toBe(false);
    expect(verifySession(token, undefined, now)).toBe(false);
  });

  it("compares passwords without treating a shorter string as equal", () => {
    expect(passwordsMatch("correct horse", "correct horse")).toBe(true);
    expect(passwordsMatch("correct horse", "correct horse ")).toBe(false);
    expect(passwordsMatch("a", "b")).toBe(false);
  });

  it("only allows a same-site path as the post-login redirect", () => {
    expect(safeNextPath("/?view=sayed")).toBe("/?view=sayed");
    expect(safeNextPath(undefined)).toBe("/");
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/\\evil")).toBe("/");
  });
});
