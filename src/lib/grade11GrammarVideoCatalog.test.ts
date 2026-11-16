import { expect, it } from "vitest";
import catalog from "@/data/grade11/grammarVideos.json";
it("configures English grammar video topics for all twelve Grade 11 units", () => {
  expect(Object.keys(catalog)).toHaveLength(12);
  for (let unit = 1; unit <= 12; unit++) {
    const videos = catalog[String(unit) as keyof typeof catalog];
    expect(videos.length).toBeGreaterThan(0);
    for (const video of videos) {
      const url = new URL(video.url);
      expect(url.origin).toBe("https://www.youtube.com");
      expect(url.searchParams.get("v")).toMatch(/^[\w-]{11}$/);
    }
  }
  expect(catalog[1][0].url).toContain("mOlFrmsOpzU");
  expect(catalog[2].find((v) => v.url.includes("IaslvsYxFVU"))).toMatchObject({
    start: 660,
    end: 1229,
  });
});
