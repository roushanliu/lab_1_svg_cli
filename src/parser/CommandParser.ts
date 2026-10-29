import type { ParsedCommand } from "./ParsedCommand.js";
import { Tokenizer } from "./Tokenizer.js";

export class CommandParser {
  public constructor(private readonly tokenizer = new Tokenizer()) {}

  public parse(line: string): ParsedCommand | undefined {
    const tokens = this.tokenizer.tokenize(line);
    if (tokens.length === 0) return undefined;
    const [name, ...args] = tokens;
    return { name, arguments: args };
  }
}
