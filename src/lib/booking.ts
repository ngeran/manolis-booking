// Slot capacity: covers already booked (excluding cancellations) plus the new
// party must not exceed the restaurant's per-slot limit.
export function slotHasCapacity(
  bookedCovers: number,
  newPartySize: number,
  maxCovers: number
): boolean {
  return bookedCovers + newPartySize <= maxCovers;
}
