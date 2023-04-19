export function assert({ success }: { success: boolean }) {
  if (!success) {
    throw new Error("Assertion failed");
  }
}
