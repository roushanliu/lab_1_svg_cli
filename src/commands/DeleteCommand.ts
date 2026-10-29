import type { ContainerShape } from "../domain/ContainerShape.js";
import type { Document } from "../domain/Document.js";
import type { Shape } from "../domain/Shape.js";
import type { Command } from "./Command.js";

export class DeleteCommand implements Command {
  public readonly name = "delete";
  private readonly shape: Shape;
  private readonly parent: ContainerShape | undefined;
  private index = -1;

  public constructor(private readonly document: Document, id: string) {
    this.shape = document.requireShape(id);
    this.parent = this.shape.parent;
  }

  public execute(): void { this.index = this.document.removeShape(this.shape); }
  public undo(): void { this.document.addShape(this.shape, this.parent, this.index); }
}
