import { Shape } from "./Shape.js";

export class Text extends Shape {
  public readonly type = "text";
  public constructor(id: string, public x: number, public y: number, public content: string) { super(id); }
  public move(dx: number, dy: number): void { this.x += dx; this.y += dy; }
  public scale(factor: number): void { this.x *= factor; this.y *= factor; }
  public describe(): string { return `text#${this.id} (${this.x},${this.y}) "${this.content}"`; }
}
