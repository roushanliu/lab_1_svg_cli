import type { Document } from "../domain/Document.js";
import type { Command } from "./Command.js";

export class ScaleCommand implements Command {
  public readonly name = "scale";
  private readonly shape;

  public constructor(document: Document, id: string, private readonly factor: number) {
    if (!Number.isFinite(factor) || factor <= 0) throw new Error("scale factor must be positive");
    this.shape = document.requireShape(id);
  }

  public execute(): string { this.shape.scale(this.factor); return `${this.shape.type}#${this.shape.id} scaled by ${this.factor}`; }
  public undo(): string { this.shape.scale(1 / this.factor); return `${this.shape.type}#${this.shape.id} scale restored`; }
}
