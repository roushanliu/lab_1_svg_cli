import { CommandDispatcher } from "../commands/CommandDispatcher.js";
import type { CommandRequest } from "../commands/CommandRequest.js";
import { DeleteCommand } from "../commands/DeleteCommand.js";
import { AddToCommand } from "../commands/AddToCommand.js";
import { GroupCommand } from "../commands/GroupCommand.js";
import { MoveCommand } from "../commands/MoveCommand.js";
import { ScaleCommand } from "../commands/ScaleCommand.js";
import { SetAttributeCommand } from "../commands/SetAttributeCommand.js";
import { UngroupCommand } from "../commands/UngroupCommand.js";
import { ZOrderCommand } from "../commands/ZOrderCommand.js";
import type { Command } from "../commands/Command.js";
import { Document } from "../domain/Document.js";
import { ContainerShape } from "../domain/ContainerShape.js";
import { CommandHistory } from "../history/CommandHistory.js";
import { SvgReader } from "../io/SvgReader.js";
import { SvgWriter } from "../io/SvgWriter.js";

export class SvgEditor {
  private currentDocument?: Document;
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
    this.dispatcher.register("move", (request) => this.moveCommand(request));
    this.dispatcher.register("scale", (request) => this.scaleCommand(request));
    this.dispatcher.register("set", (request) => this.setAttributeCommand(request));
    this.dispatcher.register("delete", (request) => this.deleteCommand(request));
    this.dispatcher.register("group", (request) => this.groupCommand(request));
    this.dispatcher.register("ungroup", (request) => this.ungroupCommand(request));
    this.dispatcher.register("addto", (request) => this.addToCommand(request));
    this.dispatcher.register("front", (request) => this.zOrderCommand(request, true));
    this.dispatcher.register("back", (request) => this.zOrderCommand(request, false));
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
    const inIndex = parameters.indexOf("in");
    let shapeParameters = parameters;
    let parent: ContainerShape | undefined;
    if (inIndex >= 0) {
      if (inIndex !== parameters.length - 2) throw new Error("in requires a container id at the end of create");
      const candidate = this.currentDocument.find(parameters[inIndex + 1]);
      if (!candidate) throw new Error(`no such container: ${parameters[inIndex + 1]}`);
      if (!(candidate instanceof ContainerShape)) throw new Error(`not a container: ${candidate.id}`);
      parent = candidate;
      shapeParameters = parameters.slice(0, inIndex);
    }
    return this.dispatcher.createShapeCommand(this.currentDocument, type, id, shapeParameters, parent);
  }

  private moveCommand(request: CommandRequest): Command {
    const [id, dx, dy] = request.arguments;
    if (!id || dx === undefined || dy === undefined) throw new Error("move requires id, dx and dy");
    return new MoveCommand(this.document, id, this.number(dx, "dx"), this.number(dy, "dy"));
  }

  private scaleCommand(request: CommandRequest): Command {
    const [id, factor] = request.arguments;
    if (!id || factor === undefined) throw new Error("scale requires id and factor");
    return new ScaleCommand(this.document, id, this.number(factor, "factor"));
  }

  private setAttributeCommand(request: CommandRequest): Command {
    const [id, attribute, ...values] = request.arguments;
    if (!id || !attribute || values.length === 0) throw new Error("set requires id, attribute and value");
    return new SetAttributeCommand(this.document, id, attribute, values.join(" "));
  }

  private deleteCommand(request: CommandRequest): Command {
    const [id] = request.arguments;
    if (!id) throw new Error("delete requires id");
    return new DeleteCommand(this.document, id);
  }

  private groupCommand(request: CommandRequest): Command {
    const [groupId, ...ids] = request.arguments;
    if (!groupId) throw new Error("group requires a new id and at least one shape");
    return new GroupCommand(this.document, groupId, ids);
  }

  private ungroupCommand(request: CommandRequest): Command {
    const [id] = request.arguments;
    if (!id) throw new Error("ungroup requires id");
    return new UngroupCommand(this.document, id);
  }

  private addToCommand(request: CommandRequest): Command {
    const [containerId, shapeId] = request.arguments;
    if (!containerId || !shapeId) throw new Error("addto requires container id and shape id");
    return new AddToCommand(this.document, containerId, shapeId);
  }

  private zOrderCommand(request: CommandRequest, toFront: boolean): Command {
    const [id] = request.arguments;
    if (!id) throw new Error(`${toFront ? "front" : "back"} requires id`);
    return new ZOrderCommand(this.document, id, toFront);
  }

  private number(value: string, name: string): number {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error(`${name} must be numeric`);
    return number;
  }
}
