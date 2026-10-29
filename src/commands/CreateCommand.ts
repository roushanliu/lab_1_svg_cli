import type { Document } from "../domain/Document.js";
import type { ContainerShape } from "../domain/ContainerShape.js";
import type { Shape } from "../domain/Shape.js";
import type { ShapeFactory } from "../factory/ShapeFactory.js";
import type { Command } from "./Command.js";

export class CreateCommand implements Command {
  public readonly name = "create";
  private createdShape?: Shape;

  public constructor(
    private readonly document: Document,
    private readonly factory: ShapeFactory,
    private readonly type: string,
    private readonly id: string,
    private readonly parameters: readonly string[],
    private readonly parent?: ContainerShape,
  ) {}

  public execute(): string {
    this.createdShape ??= this.factory.create(this.type, this.id, this.parameters);
    this.document.addShape(this.createdShape, this.parent);
    const parent = this.parent ? ` in ${this.parent.type}#${this.parent.id}` : "";
    return `${this.createdShape.type}#${this.createdShape.id} created${parent}`;
  }

  public undo(): string {
    if (this.createdShape) this.document.removeShape(this.createdShape);
    return `${this.type}#${this.id} deleted`;
  }
}
