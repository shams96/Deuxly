import { describe, it, expect } from "vitest";
import { sniffImageType } from "@/lib/imageValidation";
import { withPhotoUrls } from "@/lib/photoUrls";
import { validateAnalysisResult } from "@/lib/analysis";

describe("sniffImageType", () => {
  const pad = (head: number[]) =>
    Buffer.from([...head, ...new Array(16).fill(0)]);

  it("recognises JPEG / PNG / WebP magic bytes", () => {
    expect(sniffImageType(pad([0xff, 0xd8, 0xff]))).toBe("image/jpeg");
    expect(sniffImageType(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
      "image/png",
    );
    const webp = Buffer.concat([
      Buffer.from("RIFF"),
      Buffer.from([0, 0, 0, 0]),
      Buffer.from("WEBP"),
      Buffer.alloc(8),
    ]);
    expect(sniffImageType(webp)).toBe("image/webp");
  });

  it("rejects non-image and too-short buffers", () => {
    expect(sniffImageType(Buffer.from("<?php evil(); ?>"))).toBeNull();
    expect(sniffImageType(Buffer.from([0xff, 0xd8]))).toBeNull();
  });
});

describe("withPhotoUrls", () => {
  it("replaces keys with authed same-origin URLs", () => {
    const out = withPhotoUrls({
      id: "p1",
      label: "Baseline",
      thumbnailUrl: "photos/u/abc-thumb.jpg",
    });
    expect(out).toMatchObject({
      id: "p1",
      label: "Baseline",
      storageUrl: "/api/photos/p1/file",
      thumbnailUrl: "/api/photos/p1/file?variant=thumb",
    });
    expect(JSON.stringify(out)).not.toContain("photos/u/abc-thumb.jpg");
  });

  it("null thumbnail stays null", () => {
    expect(withPhotoUrls({ id: "p2", thumbnailUrl: null }).thumbnailUrl).toBeNull();
  });
});

describe("validateAnalysisResult rejects oversized payloads", () => {
  it("caps the zones array", () => {
    const many = {
      summary: "x",
      disclaimer: "y",
      zones: new Array(20).fill({
        name: "forehead",
        change: "neutral",
        confidence: 0.5,
        note: "n",
      }),
    };
    expect(validateAnalysisResult(many)).toBeNull();
  });
});
