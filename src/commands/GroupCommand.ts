import { ContainerShape } from "../domain/ContainerShape.js";
import { Document } from "../domain/Document.js";
import { Group } from "../domain/Group.js";
import type { Shape } from "../domain/Shape.js";
import type { Command } from "./Command.js";

export class GroupCommand implements Command {
  public readonly name = "group";
  private readonly shapes: Shape[];
  private readonly targetParent: ContainerShape | undefined;
  private readonly targetIndex: number;
  private readonly originalParents: Array<ContainerShape | undefined>;
  private readonly originalIndexes: number[];
  private readonly group: Group;

  public constructor(private readonly document: Document, groupId: string, ids: readonly string[]) {
    if (ids.length === 0) throw new Error("group requires at least one shape");
    if (document.find(groupId)) throw new Error(`id already exists: ${groupId}`);
    const selectedShapes = ids.map((id) => document.requireShape(id));
    if (new Set(selectedShapes).size !== selectedShapes.length) throw new Error("group contains duplicate shapes");
    for (const container of selectedShapes) {
      if (container instanceof ContainerShape && selectedShapes.some((shape) => shape !== container && container.contains(shape))) {
        throw new Error(`cannot group a container into its own descendant: ${container.id}`);
      }
    }
    const selectedParents = selectedShapes.map((shape) => shape.parent);
    const selectedIndexes = selectedShapes.map((shape) => document.indexOf(shape));
    const selectedDocumentOrders = selectedShapes.map((shape) => document.documentOrder(shape));
    const order = selectedShapes.map((_, index) => index).sort((a, b) => {
      return selectedDocumentOrders[a] - selectedDocumentOrders[b];
    });
    this.shapes = order.map((index) => selectedShapes[index]);
    this.targetParent = this.shapes[0].parent;
    this.originalParents = order.map((index) => selectedParents[index]);
    this.originalIndexes = order.map((index) => selectedIndexes[index]);
    this.targetIndex = Math.min(...this.originalIndexes.filter((_, index) => this.originalParents[index] === this.targetParent));
    this.group = new Group(groupId);
  }

  public execute(): string {
    for (const shape of [...this.shapes].reverse()) {
      this.document.removeShape(shape);
    }
    this.document.addShape(this.group, this.targetParent, this.targetIndex);
    for (const shape of this.shapes) this.group.addChild(shape);
    return `g#${this.group.id} created with ${this.shapes.length} children`;
  }

  public undo(): string {
    for (const shape of [...this.shapes].reverse()) this.group.removeChild(shape);
    this.document.removeShape(this.group);
    this.shapes.forEach((shape, index) => this.document.addShape(shape, this.originalParents[index], this.originalIndexes[index]));
    return `g#${this.group.id} deleted`;
  }
}
