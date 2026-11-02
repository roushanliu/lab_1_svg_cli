import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { SvgEditor } from "../application/SvgEditor.js";
import { CommandParser } from "../parser/CommandParser.js";

export class Cli {
  private readonly parser = new CommandParser();

  public constructor(private readonly editor: SvgEditor) {}

  public async run(): Promise<void> {
    const readline = createInterface({ input, output, prompt: "svg> " });
    if (input.isTTY) readline.prompt();
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
      if (input.isTTY) readline.prompt();
    }
    readline.close();
  }
}
