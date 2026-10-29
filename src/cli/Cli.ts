import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { SvgEditor } from "../application/SvgEditor.js";
import { CommandParser } from "../parser/CommandParser.js";

export class Cli {
  private readonly parser = new CommandParser();

  public constructor(private readonly editor: SvgEditor) {}

  public async run(): Promise<void> {
    if (!input.isTTY) return;
    const readline = createInterface({ input, output, prompt: "svg> " });
    readline.prompt();
    for await (const line of readline) {
      try {
        const request = this.parser.parse(line);
        if (request) {
          const result = this.editor.dispatch(request);
          if (result) output.write(`${result}\n`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        output.write(`error: ${message}\n`);
      }
      readline.prompt();
    }
    readline.close();
  }
}
