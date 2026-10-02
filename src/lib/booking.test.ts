import { describe, it, expect } from "vitest";
import { slotHasCapacity } from "./booking";

describe("slotHasCapacity", () => {
  it("accepts a booking that fits", () => {
    expect(slotHasCapacity(10, 4, 40)).toBe(true);
  });

  it("accepts a booking that exactly reaches the limit", () => {
    expect(slotHasCapacity(36, 4, 40)).toBe(true);
  });

  it("rejects a booking that exceeds the limit", () => {
    expect(slotHasCapacity(37, 4, 40)).toBe(false);
  });

  it("rejects when the slot is already full", () => {
    expect(slotHasCapacity(40, 1, 40)).toBe(false);
  });

  it("accepts any booking on an empty slot within the limit", () => {
    expect(slotHasCapacity(0, 20, 40)).toBe(true);
    expect(slotHasCapacity(0, 21, 20)).toBe(false);
  });
});
