import { describe, expect, it } from "vitest";
import { isStaleChunkError } from "./chunkRecovery";

describe("isStaleChunkError", () => {
  it("matches Vite / browser dynamic-import 404s", () => {
    expect(
      isStaleChunkError(
        new TypeError(
          "Failed to fetch dynamically imported module: https://www.acouchpotato.com/assets/ErrorPage-BRvstyTy.js",
        ),
      ),
    ).toBe(true);
    expect(isStaleChunkError(new Error("Importing a module script failed."))).toBe(true);
    expect(isStaleChunkError("error loading dynamically imported module")).toBe(true);
  });

  it("ignores ordinary app errors", () => {
    expect(isStaleChunkError(new ReferenceError("AboutDialog is not defined"))).toBe(false);
    expect(isStaleChunkError(new Error("Snack spill"))).toBe(false);
  });
});
