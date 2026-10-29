import { Document } from "../domain/Document.js";
import type { Shape } from "../domain/Shape.js";
import type { Command } from "./Command.js";

export class ZOrderCommand implements Command {
  public readonly name: string;
  private readonly shape: Shape;
  private readonly originalIndex: number;

  public constructor(private readonly document: Document, id: string, private readonly toFront: boolean) {
    this.name = toFront ? "front" : "back";
    this.shape = document.requireShape(id);
    this.originalIndex = document.indexOf(this.shape);
  }

  public execute(): string {
    const parent = this.shape.parent;
    const siblings = parent ? parent.children : this.document.children;
    const currentIndex = siblings.indexOf(this.shape);
    const targetIndex = this.toFront ? siblings.length - 1 : 0;
    if (currentIndex === targetIndex) return `${this.shape.type}#${this.shape.id} already at ${this.toFront ? "front" : "back"}`;
    if (parent) {
      parent.removeChild(this.shape);
      parent.addChild(this.shape, targetIndex);
    } else {
      this.document.removeShape(this.shape);
      this.document.addShape(this.shape, undefined, targetIndex);
    }
    return `${this.shape.type}#${this.shape.id} moved to ${this.toFront ? "front" : "back"}`;
  }

  public undo(): string {
    const parent = this.shape.parent;
    if (parent) {
      parent.removeChild(this.shape);
      parent.addChild(this.shape, this.originalIndex);
    } else {
      this.document.removeShape(this.shape);
      this.document.addShape(this.shape, undefined, this.originalIndex);
    }
    return `${this.shape.type}#${this.shape.id} z-order restored`;
  }
}
