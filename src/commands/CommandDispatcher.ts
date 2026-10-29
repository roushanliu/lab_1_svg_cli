import type { Command } from "./Command.js";
import type { CommandRequest } from "./CommandRequest.js";

export type CommandBuilder = (request: CommandRequest) => Command;

export class CommandDispatcher {
  private readonly builders = new Map<string, CommandBuilder>();

  public register(name: string, builder: CommandBuilder): void { this.builders.set(name, builder); }

  public dispatch(request: CommandRequest): Command {
    const builder = this.builders.get(request.name);
    if (!builder) throw new Error(`unknown command: ${request.name}`);
    return builder(request);
  }
}
