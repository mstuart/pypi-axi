import { describe, expect, it } from "vitest";
import { searchCommand } from "../../src/commands/search.js";

describe("searchCommand", () => {
  it("always returns an honest VALIDATION_ERROR pointing at view", async () => {
    await expect(searchCommand(["anything"])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: "PyPI has no public search API",
    });
  });

  it("never scrapes the HTML search page even with no args", async () => {
    await expect(searchCommand([])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("rejects an unknown flag before the not-supported error", async () => {
    await expect(searchCommand(["--bogus"])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      suggestions: expect.arrayContaining(["valid flags: (none)"]),
    });
  });
});
