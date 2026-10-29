import type { Document } from "../domain/Document.js";
import { ContainerShape } from "../domain/ContainerShape.js";
import type { Command } from "./Command.js";

export class MoveCommand implements Command {
  public readonly name = "move";
  private readonly shape;

  public constructor(document: Document, id: string, private readonly dx: number, private readonly dy: number) {
    this.shape = document.requireShape(id);
  }

  public execute(): string {
    this.shape.move(this.dx, this.dy);
    return this.shape instanceof ContainerShape
      ? `${this.shape.type}#${this.shape.id} moved by (${this.dx},${this.dy})`
      : `${this.shape.type}#${this.shape.id} moved to ${this.shape.positionSummary()}`;
  }
  public undo(): string {
    this.shape.move(-this.dx, -this.dy);
    return this.shape instanceof ContainerShape
      ? `${this.shape.type}#${this.shape.id} moved back by (${-this.dx},${-this.dy})`
      : `${this.shape.type}#${this.shape.id} moved back to ${this.shape.positionSummary()}`;
  }
}
