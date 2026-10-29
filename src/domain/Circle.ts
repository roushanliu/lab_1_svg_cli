import { Shape } from "./Shape.js";

export class Circle extends Shape {
  public readonly type = "circle";
  public constructor(id: string, public cx: number, public cy: number, public r: number, fill?: string) {
    super(id);
    if (fill !== undefined) this.setAttribute("fill", fill);
  }
  public move(dx: number, dy: number): void { this.cx += dx; this.cy += dy; }
  public scale(factor: number): void { this.cx *= factor; this.cy *= factor; this.r *= factor; }
  public describe(): string { return `circle#${this.id} cx=${this.cx} cy=${this.cy} r=${this.r}`; }

  public getAttribute(name: string): string | undefined {
    if (name === "cx") return String(this.cx);
    if (name === "cy") return String(this.cy);
    if (name === "r") return String(this.r);
    return super.getAttribute(name);
  }

  public setAttribute(name: string, value: string): void {
    if (["cx", "cy", "r"].includes(name)) {
      const number = Number(value);
      if (!Number.isFinite(number)) throw new Error(`attribute must be numeric: ${name}`);
      if (name === "cx") this.cx = number;
      else if (name === "cy") this.cy = number;
      else this.r = number;
      return;
    }
    if (!["fill", "stroke", "stroke-width"].includes(name)) throw new Error(`unknown attribute: ${name}`);
    super.setAttribute(name, value);
  }
}
