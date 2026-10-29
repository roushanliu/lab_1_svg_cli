import { CommandDispatcher } from "../commands/CommandDispatcher.js";
import type { CommandRequest } from "../commands/CommandRequest.js";
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

  public init(width = 800, height = 600): void {
    this.currentDocument = new Document(width, height);
    this.history.lockAfterDocumentCommand();
  }

  public get document(): Document {
    if (!this.currentDocument) throw new Error("no document. use 'init' or 'read' first");
    return this.currentDocument;
  }

  public dispatch(request: CommandRequest): void {
    const command = this.dispatcher.dispatch(request);
    this.history.execute(command);
  }
}
