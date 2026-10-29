import { Shape } from "./Shape.js";

export class Line extends Shape {
  public readonly type = "line";
  public constructor(id: string, public x1: number, public y1: number, public x2: number, public y2: number, stroke?: string) {
    super(id);
    if (stroke !== undefined) this.setAttribute("stroke", stroke);
  }
  public move(dx: number, dy: number): void { this.x1 += dx; this.y1 += dy; this.x2 += dx; this.y2 += dy; }
  public scale(factor: number): void { this.x1 *= factor; this.y1 *= factor; this.x2 *= factor; this.y2 *= factor; }
  public describe(): string { return `line#${this.id} (${this.x1},${this.y1}) -> (${this.x2},${this.y2})`; }
}
