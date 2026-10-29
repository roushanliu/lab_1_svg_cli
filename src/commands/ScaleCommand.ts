import type { Document } from "../domain/Document.js";
import type { Command } from "./Command.js";

export class ScaleCommand implements Command {
  public readonly name = "scale";
  private readonly shape;

  public constructor(document: Document, id: string, private readonly factor: number) {
    if (!Number.isFinite(factor) || factor <= 0) throw new Error("scale factor must be positive");
    this.shape = document.requireShape(id);
  }

  public execute(): void { this.shape.scale(this.factor); }
  public undo(): void { this.shape.scale(1 / this.factor); }
}
