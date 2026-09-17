import { describe, expect, it } from "vitest";
import { storageGet } from "./storage";

describe("public media storage paths", () => {
  it("returns the application-owned media endpoint", async () => {
    await expect(storageGet("avatars/user-1.webp")).resolves.toEqual({
      key: "avatars/user-1.webp",
      url: "/api/media/avatars/user-1.webp",
    });
  });

  it("normalizes leading slashes before generating the media URL", async () => {
    await expect(storageGet("/sepidfinal.webp")).resolves.toEqual({
      key: "sepidfinal.webp",
      url: "/api/media/sepidfinal.webp",
    });
  });
});
