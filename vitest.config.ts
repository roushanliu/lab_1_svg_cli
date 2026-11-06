import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      reporter: ["text", "html"],
      exclude: [
        "src/main.ts",
        "src/cli/Cli.ts",
        "src/**/*.test.ts",
        "src/**/Command.ts",
        "src/**/CommandRequest.ts",
        "src/**/ParsedCommand.ts",
        "src/**/ShapeProvider.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 70,
        branches: 70,
        statements: 80,
      },
    },
  },
});
