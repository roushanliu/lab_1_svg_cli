import { Shape } from "./Shape.js";

export class Ellipse extends Shape {
  public readonly type = "ellipse";
  public constructor(id: string, public cx: number, public cy: number, public rx: number, public ry: number, fill?: string) {
    super(id);
    if (fill !== undefined) this.setAttribute("fill", fill);
  }
  public move(dx: number, dy: number): void { this.cx += dx; this.cy += dy; }
  public scale(factor: number): void { this.cx *= factor; this.cy *= factor; this.rx *= factor; this.ry *= factor; }
  public describe(): string { return `ellipse#${this.id} cx=${this.cx} cy=${this.cy} rx=${this.rx} ry=${this.ry}`; }
}
