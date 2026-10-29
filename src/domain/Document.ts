import type { ContainerShape } from "./ContainerShape.js";
import { Shape } from "./Shape.js";

export class Document {
  private readonly rootShapes: Shape[] = [];

  public constructor(public width = 800, public height = 600) {}

  public get children(): readonly Shape[] { return this.rootShapes; }

  public addShape(shape: Shape, parent?: ContainerShape, index?: number): void {
    if (this.find(shape.id)) throw new Error(`id already exists: ${shape.id}`);
    if (parent) parent.addChild(shape, index); else {
      shape.setParent(undefined);
      if (index === undefined) this.rootShapes.push(shape); else this.rootShapes.splice(index, 0, shape);
    }
  }

  public removeShape(shape: Shape): number {
    if (shape.parent) return shape.parent.removeChild(shape);
    const index = this.rootShapes.indexOf(shape);
    if (index < 0) throw new Error(`no such shape: ${shape.id}`);
    this.rootShapes.splice(index, 1);
    shape.setParent(undefined);
    return index;
  }

  public find(id: string): Shape | undefined {
    const visit = (shapes: readonly Shape[]): Shape | undefined => {
      for (const shape of shapes) {
        if (shape.id === id) return shape;
        const container = shape as Shape & { children?: readonly Shape[] };
        const found = container.children ? visit(container.children) : undefined;
        if (found) return found;
      }
      return undefined;
    };
    return visit(this.rootShapes);
  }

  public requireShape(id: string): Shape {
    const shape = this.find(id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }

  public indexOf(shape: Shape): number {
    const siblings = shape.parent ? shape.parent.children : this.rootShapes;
    const index = siblings.indexOf(shape);
    if (index < 0) throw new Error(`no such shape: ${shape.id}`);
    return index;
  }

  public tree(): string {
    const lines = [`svg (${this.width}x${this.height})`];
    const append = (shapes: readonly Shape[], prefix: string): void => {
      shapes.forEach((shape, index) => {
        const last = index === shapes.length - 1;
        lines.push(`${prefix}${last ? "└── " : "├── "}${shape.describe()}`);
        const container = shape as Shape & { children?: readonly Shape[] };
        if (container.children) append(container.children, `${prefix}${last ? "    " : "│   "}`);
      });
    };
    append(this.rootShapes, "");
    return lines.join("\n");
  }
}
