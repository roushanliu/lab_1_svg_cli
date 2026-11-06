import { describe, expect, it } from "vitest";
import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

describe("CLI process", () => {
  it("runs a complete command session and reports errors consistently", () => {
    const filePath = join(process.cwd(), `cli-e2e-${Date.now()}.svg`);
    const tsxEntry = join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
    const input = [
      "init 120 80",
      "create rect r1 10 20 30 40 #4a90d9",
      "# this line is a comment",
      "tree",
      `save ${filePath}`,
      `read ${filePath}`,
      "show r1",
      "unknown-command",
      "",
    ].join("\n");

    try {
      const result = spawnSync(process.execPath, [tsxEntry, "src/main.ts"], {
        cwd: process.cwd(),
        input,
        encoding: "utf8",
      });

      expect(result.error).toBeUndefined();
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("svg-editor 0.1");
      expect(result.stdout).toContain("canvas 120x80 created");
      expect(result.stdout).toContain("rect#r1 x=10 y=20 w=30 h=40 fill=#4a90d9");
      expect(result.stdout).toContain(`saved to ${filePath} (1 elements)`);
      expect(result.stdout).toContain(`read ${filePath} (1 elements)`);
      expect(result.stdout).toContain("rect#r1 x=10 y=20 w=30 h=40 fill=#4a90d9 parent=svg");
      expect(result.stdout).toContain("error: unknown command: unknown-command");
      expect(result.stdout).not.toContain("error: this line is a comment");
    } finally {
      if (existsSync(filePath)) unlinkSync(filePath);
    }
  });
});
