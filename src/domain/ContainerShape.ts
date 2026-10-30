import { Shape } from "./Shape.js";

export abstract class ContainerShape extends Shape {
  private readonly childShapes: Shape[] = [];

  public get children(): readonly Shape[] {
    return this.childShapes;
  }

  public addChild(shape: Shape, index = this.childShapes.length): void {
    if (shape === this || this.contains(shape)) {
      throw new Error("cannot add a container to its own descendant");
    }
    if (shape.parent) {
      shape.parent.removeChild(shape);
    }
    this.childShapes.splice(index, 0, shape);
    shape.setParent(this);
  }

  public removeChild(shape: Shape): number {
    const index = this.childShapes.indexOf(shape);
    if (index < 0) {
      throw new Error(`shape is not a child: ${shape.id}`);
    }
    this.childShapes.splice(index, 1);
    shape.setParent(undefined);
    return index;
  }

  public contains(shape: Shape): boolean {
    return this.childShapes.some((child) => child === shape || (child instanceof ContainerShape && child.contains(shape)));
  }

  public move(dx: number, dy: number): void {
    for (const child of this.childShapes) {
      child.move(dx, dy);
    }
  }

  public scale(factor: number): void {
    for (const child of this.childShapes) {
      child.scale(factor);
    }
  }

  public describe(): string {
    const styles = this.styleDescription();
    return `${this.type}#${this.id}${styles ? ` ${styles}` : ""}`;
  }

  public toSvg(indent = 0): string {
    const spaces = " ".repeat(indent);
    const children = this.childShapes.map((child) => child.toSvg(indent + 2)).join("\n");
    return `${spaces}<g id="${Shape.escapeXml(this.id)}"${this.svgStyleAttributes()}>${children ? `\n${children}\n${spaces}` : ""}</g>`;
  }
}
