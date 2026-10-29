import { CommandDispatcher } from "../commands/CommandDispatcher.js";
import type { CommandRequest } from "../commands/CommandRequest.js";
import { CreateCommand } from "../commands/CreateCommand.js";
import type { Command } from "../commands/Command.js";
import { Document } from "../domain/Document.js";
import { ShapeFactory } from "../factory/ShapeFactory.js";
import { CommandHistory } from "../history/CommandHistory.js";
import { SvgReader } from "../io/SvgReader.js";
import { SvgWriter } from "../io/SvgWriter.js";

export class SvgEditor {
  private currentDocument?: Document;
  public readonly factory = new ShapeFactory();
  public readonly history = new CommandHistory();
  public readonly dispatcher = new CommandDispatcher();
  public readonly reader = new SvgReader();
  public readonly writer = new SvgWriter();

  public constructor() {
    this.dispatcher.register("init", (request) => () => {
      const width = request.arguments[0] ? Number(request.arguments[0]) : 800;
      const height = request.arguments[1] ? Number(request.arguments[1]) : 600;
      this.init(width, height);
      return `canvas ${width}x${height} created`;
    });
    this.dispatcher.register("create", (request) => this.createCommand(request));
    this.dispatcher.register("tree", () => () => this.document.tree());
    this.dispatcher.register("undo", () => () => { this.history.undo(); return undefined; });
    this.dispatcher.register("redo", () => () => { this.history.redo(); return undefined; });
  }

  public init(width = 800, height = 600): void {
    this.currentDocument = new Document(width, height);
    this.history.lockAfterDocumentCommand();
  }

  public get document(): Document {
    if (!this.currentDocument) throw new Error("no document. use 'init' or 'read' first");
    return this.currentDocument;
  }

  public dispatch(request: CommandRequest): string | undefined {
    const result = this.dispatcher.dispatch(request);
    if (typeof result === "function") return result();
    this.history.execute(result);
    return `${result.name} completed`;
  }

  private createCommand(request: CommandRequest): Command {
    if (!this.currentDocument) throw new Error("no document. use 'init' or 'read' first");
    const [type, id, ...parameters] = request.arguments;
    if (!type || !id) throw new Error("create requires a type and id");
    return new CreateCommand(this.currentDocument, this.factory, type, id, parameters);
  }
}
