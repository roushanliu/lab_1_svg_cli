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
  private currentPath?: string;
  public readonly history = new CommandHistory();
  public readonly dispatcher = new CommandDispatcher();
  public readonly reader = new SvgReader(() => {});
  public readonly writer = new SvgWriter();

  public constructor() {
    this.dispatcher.register("init", (request) => () => {
      if (request.arguments.length > 2) throw new Error("init accepts width and height");
      const width = request.arguments[0] ? Number(request.arguments[0]) : 800;
      const height = request.arguments[1] ? Number(request.arguments[1]) : 600;
      this.init(width, height);
      return `canvas ${width}x${height} created`;
    });
    this.dispatcher.register("canvas", (request) => () => {
      if (request.arguments.length === 0) return `${this.document.width}x${this.document.height}`;
      if (request.arguments.length !== 2) throw new Error("canvas requires width and height");
      this.document.resize(this.number(request.arguments[0], "width"), this.number(request.arguments[1], "height"));
      this.history.lockAfterDocumentCommand();
      return `canvas ${this.document.width}x${this.document.height} updated`;
    });
    this.dispatcher.register("show", (request) => () => {
      if (request.arguments.length !== 1) throw new Error("show requires id");
      const [id] = request.arguments;
      if (!id) throw new Error("show requires id");
      return this.document.show(id);
    });
    this.dispatcher.register("help", () => () => [
      "init [w] [h]", "read <file.svg>", "save [file.svg]", "canvas [w] [h]",
      "create <type> <id> [params...] [in <containerId>]", "delete <id>",
      "move <id> <dx> <dy>", "scale <id> <factor>", "set <id> <attr> <value>",
      "group <newGid> <id1> <id2>...", "ungroup <gid>", "addto <gid> <id>",
      "front <id>", "back <id>", "tree [id]", "show <id>", "help", "undo", "redo",
    ].join("\n"));
    this.dispatcher.register("save", (request) => () => {
      if (request.arguments.length > 1) throw new Error("save accepts at most one file path");
      const path = request.arguments[0] ?? this.currentPath;
      if (!path) throw new Error("save requires a file path");
      this.writer.write(path, this.document);
      this.currentPath = path;
      this.history.lockAfterDocumentCommand();
      return `saved to ${path} (${this.document.elementCount()} elements)`;
    });
    this.dispatcher.register("read", (request) => () => {
      if (request.arguments.length !== 1) throw new Error("read requires a file path");
      const [path] = request.arguments;
      if (!path) throw new Error("read requires a file path");
      const document = this.reader.read(path);
      this.currentDocument = document;
      this.currentPath = path;
      this.history.lockAfterDocumentCommand();
      const warningText = this.reader.warnings.length ? `${this.reader.warnings.join("\n")}\n` : "";
      return `${warningText}read ${path} (${document.elementCount()} elements)`;
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
    this.dispatcher.register("tree", (request) => () => {
      if (request.arguments.length > 1) throw new Error("tree accepts at most one id");
      return this.document.tree(request.arguments[0]);
    });
    this.dispatcher.register("undo", () => () => this.history.undo());
    this.dispatcher.register("redo", () => () => this.history.redo());
  }

  public init(width = 800, height = 600): void {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new Error("canvas dimensions must be positive");
    }
    this.currentDocument = new Document(width, height);
    this.currentPath = undefined;
    this.history.lockAfterDocumentCommand();
  }

  public get document(): Document {
    if (!this.currentDocument) throw new Error("no document. use 'init' or 'read' first");
    return this.currentDocument;
  }

  public dispatch(request: CommandRequest): string | undefined {
    const result = this.dispatcher.dispatch(request);
    if (typeof result === "function") return result();
    return this.history.execute(result);
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
    if (request.arguments.length !== 3) throw new Error("move requires id, dx and dy");
    const [id, dx, dy] = request.arguments;
    if (!id || dx === undefined || dy === undefined) throw new Error("move requires id, dx and dy");
    return new MoveCommand(this.document, id, this.number(dx, "dx"), this.number(dy, "dy"));
  }

  private scaleCommand(request: CommandRequest): Command {
    if (request.arguments.length !== 2) throw new Error("scale requires id and factor");
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
    if (request.arguments.length !== 1) throw new Error("delete requires id");
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
    if (request.arguments.length !== 1) throw new Error("ungroup requires id");
    const [id] = request.arguments;
    if (!id) throw new Error("ungroup requires id");
    return new UngroupCommand(this.document, id);
  }

  private addToCommand(request: CommandRequest): Command {
    if (request.arguments.length !== 2) throw new Error("addto requires container id and shape id");
    const [containerId, shapeId] = request.arguments;
    if (!containerId || !shapeId) throw new Error("addto requires container id and shape id");
    return new AddToCommand(this.document, containerId, shapeId);
  }

  private zOrderCommand(request: CommandRequest, toFront: boolean): Command {
    if (request.arguments.length !== 1) throw new Error(`${toFront ? "front" : "back"} requires id`);
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
