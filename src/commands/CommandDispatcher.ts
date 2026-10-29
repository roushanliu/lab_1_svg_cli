import type { Command } from "./Command.js";
import type { CommandRequest } from "./CommandRequest.js";
import type { ContainerShape } from "../domain/ContainerShape.js";
import type { Document } from "../domain/Document.js";
import { CreateCommand } from "./CreateCommand.js";
import { ShapeFactory } from "../factory/ShapeFactory.js";

export type DispatchResult = Command | (() => string | undefined);
export type CommandBuilder = (request: CommandRequest) => DispatchResult;

export class CommandDispatcher {
  private readonly builders = new Map<string, CommandBuilder>();
  private readonly shapeFactory = new ShapeFactory();

  public register(name: string, builder: CommandBuilder): void { this.builders.set(name, builder); }

  public dispatch(request: CommandRequest): DispatchResult {
    const builder = this.builders.get(request.name);
    if (!builder) throw new Error(`unknown command: ${request.name}`);
    return builder(request);
  }

  public createShapeCommand(
    document: Document,
    type: string,
    id: string,
    parameters: readonly string[],
    parent?: ContainerShape,
  ): Command {
    return new CreateCommand(document, this.shapeFactory, type, id, parameters, parent);
  }
}
