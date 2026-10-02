import { describe, it, expect, afterEach } from "vitest";
import { localDateKey } from "./date";

describe("localDateKey", () => {
  const originalTz = process.env.RESTAURANT_TZ;

  afterEach(() => {
    if (originalTz === undefined) delete process.env.RESTAURANT_TZ;
    else process.env.RESTAURANT_TZ = originalTz;
  });

  it("follows the restaurant timezone, not UTC", () => {
    process.env.RESTAURANT_TZ = "Europe/Athens";
    // 00:30 in Athens on Oct 2 = 21:30 UTC on Oct 1
    expect(localDateKey(new Date("2026-10-01T21:30:00Z"))).toBe("2026-10-02");
  });

  it("defaults to UTC when RESTAURANT_TZ is unset", () => {
    delete process.env.RESTAURANT_TZ;
    expect(localDateKey(new Date("2026-10-01T21:30:00Z"))).toBe("2026-10-01");
  });

  it("handles Athens summer time (UTC+3)", () => {
    process.env.RESTAURANT_TZ = "Europe/Athens";
    expect(localDateKey(new Date("2026-07-15T20:30:00Z"))).toBe("2026-07-15");
    expect(localDateKey(new Date("2026-07-15T21:30:00Z"))).toBe("2026-07-16");
  });

  it("handles Athens winter time (UTC+2)", () => {
    process.env.RESTAURANT_TZ = "Europe/Athens";
    expect(localDateKey(new Date("2026-01-15T21:59:00Z"))).toBe("2026-01-15");
    expect(localDateKey(new Date("2026-01-15T22:00:00Z"))).toBe("2026-01-16");
  });
});
