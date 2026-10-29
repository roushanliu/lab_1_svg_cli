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

  public execute(): void {
    this.createdShape ??= this.factory.create(this.type, this.id, this.parameters);
    this.document.addShape(this.createdShape, this.parent);
  }

  public undo(): void {
    if (this.createdShape) this.document.removeShape(this.createdShape);
  }
}
