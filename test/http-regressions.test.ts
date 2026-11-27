import { afterEach, expect, it, vi } from "vitest";
import {
  fetchDownloadsRecent,
  fetchPackument,
  fetchVersion,
} from "../src/pypi.js";

afterEach(() => vi.unstubAllGlobals());

const requests = [
  ["package", () => fetchPackument("demo")],
  ["version", () => fetchVersion("demo", "1.0")],
  ["downloads", () => fetchDownloadsRecent("demo")],
] as const;

it.each(requests)(
  "cancels unread HTTP bodies on the %s path",
  async (kind, request) => {
    const cancel = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(new ReadableStream({ cancel }), { status: 404 })
        )
    );
    if (kind === "downloads") {
      await expect(request()).resolves.toBeNull();
    } else {
      await expect(request()).rejects.toMatchObject({ code: "NOT_FOUND" });
    }
    expect(cancel).toHaveBeenCalledOnce();
  }
);

it("cancels server error bodies without losing their classification", async () => {
  const cancel = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(new ReadableStream({ cancel }), { status: 503 })
      )
  );
  await expect(fetchPackument("demo")).rejects.toMatchObject({
    code: "REGISTRY",
  });
  expect(cancel).toHaveBeenCalledOnce();
});

it("keeps HTTP error classification when body cancellation fails", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        new ReadableStream({
          cancel() {
            throw new Error("cleanup failed");
          },
        }),
        { status: 503 }
      )
    )
  );
  await expect(fetchPackument("demo")).rejects.toMatchObject({
    code: "REGISTRY",
  });
});
