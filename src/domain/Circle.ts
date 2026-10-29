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
}
