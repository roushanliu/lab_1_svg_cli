import type { Document } from "../domain/Document.js";
import type { Command } from "./Command.js";

export class MoveCommand implements Command {
  public readonly name = "move";
  private readonly shape;

  public constructor(document: Document, id: string, private readonly dx: number, private readonly dy: number) {
    this.shape = document.requireShape(id);
  }

  public execute(): void { this.shape.move(this.dx, this.dy); }
  public undo(): void { this.shape.move(-this.dx, -this.dy); }
}
