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
  public describe(): string { return `rect#${this.id} x=${this.x} y=${this.y} w=${this.width} h=${this.height}`; }
}
