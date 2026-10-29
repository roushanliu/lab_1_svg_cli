import { Shape } from "./Shape.js";

export class Rect extends Shape {
  public readonly type = "rect";

  public constructor(
    id: string,
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    fill?: string,
  ) {
    super(id);
    if (fill !== undefined) this.setAttribute("fill", fill);
  }

  public move(dx: number, dy: number): void { this.x += dx; this.y += dy; }
  public scale(factor: number): void { this.x *= factor; this.y *= factor; this.width *= factor; this.height *= factor; }
  public positionSummary(): string { return `(${this.x},${this.y})`; }
  public describe(): string {
    const styles = this.styleDescription();
    return `rect#${this.id} x=${this.x} y=${this.y} w=${this.width} h=${this.height}${styles ? ` ${styles}` : ""}`;
  }

  public getAttribute(name: string): string | undefined {
    if (name === "x") return String(this.x);
    if (name === "y") return String(this.y);
    if (name === "width") return String(this.width);
    if (name === "height") return String(this.height);
    return super.getAttribute(name);
  }

  public setAttribute(name: string, value: string): void {
    if (["x", "y", "width", "height"].includes(name)) {
      const number = Number(value);
      if (!Number.isFinite(number)) throw new Error(`attribute must be numeric: ${name}`);
      if (name === "x") this.x = number;
      else if (name === "y") this.y = number;
      else if (name === "width") this.width = number;
      else this.height = number;
      return;
    }
    if (!["fill", "stroke", "stroke-width"].includes(name)) throw new Error(`unknown attribute: ${name}`);
    super.setAttribute(name, value);
  }
}
