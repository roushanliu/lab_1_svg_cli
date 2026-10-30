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

  public resize(width: number, height: number): void {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new Error("canvas dimensions must be positive");
    }
    this.width = width;
    this.height = height;
  }

  public show(id: string): string {
    const shape = this.requireShape(id);
    const parent = shape.parent ? `${shape.parent.type}#${shape.parent.id}` : "svg";
    const lines = [`${shape.describe()} parent=${parent}`];
    for (const [name, value] of shape.attributesSnapshot) lines.push(`  ${name}=${value}`);
    return lines.join("\n");
  }

  public documentOrder(shape: Shape): number {
    let order = 0;
    let result = -1;
    const visit = (shapes: readonly Shape[]): void => {
      for (const current of shapes) {
        if (current === shape) { result = order; return; }
        order += 1;
        const container = current as Shape & { children?: readonly Shape[] };
        if (container.children) visit(container.children);
        if (result >= 0) return;
      }
    };
    visit(this.rootShapes);
    if (result < 0) throw new Error(`no such shape: ${shape.id}`);
    return result;
  }

  public tree(id?: string): string {
    if (id) {
      const shape = this.requireShape(id);
      const lines = [shape.describe()];
      const container = shape as Shape & { children?: readonly Shape[] };
      const append = (shapes: readonly Shape[], prefix: string): void => {
        shapes.forEach((child, index) => {
          const last = index === shapes.length - 1;
          lines.push(`${prefix}${last ? "└── " : "├── "}${child.describe()}`);
          const childContainer = child as Shape & { children?: readonly Shape[] };
          if (childContainer.children) append(childContainer.children, `${prefix}${last ? "    " : "│   "}`);
        });
      };
      if (container.children) append(container.children, "");
      return lines.join("\n");
    }

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

  public toSvg(): string {
    const children = this.rootShapes.map((shape) => shape.toSvg(2)).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">${children ? `\n${children}\n` : ""}</svg>\n`;
  }
}
