import { ContainerShape } from "../domain/ContainerShape.js";
import { Document } from "../domain/Document.js";
import { Group } from "../domain/Group.js";
import type { Shape } from "../domain/Shape.js";
import type { Command } from "./Command.js";

export class UngroupCommand implements Command {
  public readonly name = "ungroup";
  private readonly group: Group;
  private readonly parent: ContainerShape | undefined;
  private readonly index: number;
  private readonly children: Shape[];

  public constructor(private readonly document: Document, id: string) {
    const shape = document.requireShape(id);
    if (!(shape instanceof Group)) throw new Error(`cannot ungroup composite shape: ${id}`);
    this.group = shape;
    this.parent = shape.parent;
    if (!this.parent) throw new Error(`cannot ungroup top-level container: ${id}`);
    this.index = document.indexOf(shape);
    this.children = [...shape.children];
  }

  public execute(): string {
    this.document.removeShape(this.group);
    for (const child of this.children) this.group.removeChild(child);
    this.children.forEach((child, offset) => this.document.addShape(child, this.parent, this.index + offset));
    return `g#${this.group.id} ungrouped`;
  }

  public undo(): string {
    for (const child of [...this.children].reverse()) this.document.removeShape(child);
    this.document.addShape(this.group, this.parent, this.index);
    for (const child of this.children) this.group.addChild(child);
    return `g#${this.group.id} restored with ${this.children.length} children`;
  }
}
