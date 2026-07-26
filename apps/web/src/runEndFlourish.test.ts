import { describe, expect, it } from "vitest";
import { runEndPill } from "./runEndFlourish";

describe("runEndPill", () => {
  it("names each finish beat", () => {
    expect(runEndPill("won", "target")).toBe("Couch clear!");
    expect(runEndPill("timeout", "timed")).toBe("Time's up!");
    expect(runEndPill("timeout", "survival")).toBe("Clock ran dry!");
    expect(runEndPill("quit", "timed")).toBe("That's a wrap!");
  });
});
