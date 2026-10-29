import { ContainerShape } from "../domain/ContainerShape.js";
import { Document } from "../domain/Document.js";
import type { Shape } from "../domain/Shape.js";
import type { Command } from "./Command.js";

export class AddToCommand implements Command {
  public readonly name = "addto";
  private readonly container: ContainerShape;
  private readonly shape: Shape;
  private readonly sourceParent: ContainerShape | undefined;
  private readonly sourceIndex: number;

  public constructor(private readonly document: Document, containerId: string, shapeId: string) {
    const container = document.requireShape(containerId);
    if (!(container instanceof ContainerShape)) throw new Error(`not a container: ${containerId}`);
    this.container = container;
    this.shape = document.requireShape(shapeId);
    if (this.shape === container || (this.shape instanceof ContainerShape && this.shape.contains(container))) {
      throw new Error(`cannot add a container into its own descendant: ${containerId}`);
    }
    this.sourceParent = this.shape.parent;
    this.sourceIndex = document.indexOf(this.shape);
  }

  public execute(): string {
    this.document.removeShape(this.shape);
    this.container.addChild(this.shape);
    return `${this.shape.type}#${this.shape.id} moved into ${this.container.type}#${this.container.id}`;
  }
  public undo(): string {
    this.container.removeChild(this.shape);
    this.document.addShape(this.shape, this.sourceParent, this.sourceIndex);
    return `${this.shape.type}#${this.shape.id} restored to original parent`;
  }
}
