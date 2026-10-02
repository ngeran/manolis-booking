import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isLockedOut, recordFailure, clearFailures } from "./rate-limit";

// Unique keys per test — limiter state is module-level and shared
const KEY = (n: string) => `user-${n}`;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("rate-limit", () => {
  it("does not lock a fresh key", () => {
    expect(isLockedOut(KEY("fresh"))).toBe(false);
  });

  it("locks after 5 failures", () => {
    const k = KEY("five");
    for (let i = 0; i < 4; i++) recordFailure(k);
    expect(isLockedOut(k)).toBe(false);
    recordFailure(k);
    expect(isLockedOut(k)).toBe(true);
  });

  it("unlocks after the window passes", () => {
    const k = KEY("window");
    for (let i = 0; i < 5; i++) recordFailure(k);
    expect(isLockedOut(k)).toBe(true);
    vi.advanceTimersByTime(16 * 60 * 1000);
    expect(isLockedOut(k)).toBe(false);
  });

  it("keeps counting within the sliding window", () => {
    const k = KEY("sliding");
    for (let i = 0; i < 4; i++) recordFailure(k);
    vi.advanceTimersByTime(10 * 60 * 1000);
    recordFailure(k); // 5th failure, still inside the 15-min window
    expect(isLockedOut(k)).toBe(true);
  });

  it("clearFailures resets the counter", () => {
    const k = KEY("cleared");
    for (let i = 0; i < 5; i++) recordFailure(k);
    expect(isLockedOut(k)).toBe(true);
    clearFailures(k);
    expect(isLockedOut(k)).toBe(false);
  });

  it("tracks keys independently", () => {
    const a = KEY("indep-a");
    const b = KEY("indep-b");
    for (let i = 0; i < 5; i++) recordFailure(a);
    expect(isLockedOut(a)).toBe(true);
    expect(isLockedOut(b)).toBe(false);
  });
});
