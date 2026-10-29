import { Shape } from "./Shape.js";

export class Line extends Shape {
  public readonly type = "line";
  public constructor(id: string, public x1: number, public y1: number, public x2: number, public y2: number, stroke?: string) {
    super(id);
    if (stroke !== undefined) this.setAttribute("stroke", stroke);
  }
  public move(dx: number, dy: number): void { this.x1 += dx; this.y1 += dy; this.x2 += dx; this.y2 += dy; }
  public scale(factor: number): void { this.x1 *= factor; this.y1 *= factor; this.x2 *= factor; this.y2 *= factor; }
  public describe(): string {
    const styles = this.styleDescription();
    return `line#${this.id} (${this.x1},${this.y1}) -> (${this.x2},${this.y2})${styles ? ` ${styles}` : ""}`;
  }

  public getAttribute(name: string): string | undefined {
    if (name === "x1") return String(this.x1);
    if (name === "y1") return String(this.y1);
    if (name === "x2") return String(this.x2);
    if (name === "y2") return String(this.y2);
    return super.getAttribute(name);
  }

  public setAttribute(name: string, value: string): void {
    if (["x1", "y1", "x2", "y2"].includes(name)) {
      const number = Number(value);
      if (!Number.isFinite(number)) throw new Error(`attribute must be numeric: ${name}`);
      if (name === "x1") this.x1 = number;
      else if (name === "y1") this.y1 = number;
      else if (name === "x2") this.x2 = number;
      else this.y2 = number;
      return;
    }
    if (!["fill", "stroke", "stroke-width"].includes(name)) throw new Error(`unknown attribute: ${name}`);
    super.setAttribute(name, value);
  }
}
