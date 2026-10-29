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

  public execute(): void {
    const parent = this.shape.parent;
    const siblings = parent ? parent.children : this.document.children;
    const currentIndex = siblings.indexOf(this.shape);
    const targetIndex = this.toFront ? siblings.length - 1 : 0;
    if (currentIndex === targetIndex) return;
    if (parent) {
      parent.removeChild(this.shape);
      parent.addChild(this.shape, targetIndex);
    } else {
      this.document.removeShape(this.shape);
      this.document.addShape(this.shape, undefined, targetIndex);
    }
  }

  public undo(): void {
    const parent = this.shape.parent;
    if (parent) {
      parent.removeChild(this.shape);
      parent.addChild(this.shape, this.originalIndex);
    } else {
      this.document.removeShape(this.shape);
      this.document.addShape(this.shape, undefined, this.originalIndex);
    }
  }
}
