import { Shape } from "./Shape.js";

export class Text extends Shape {
  public readonly type = "text";
  public constructor(id: string, public x: number, public y: number, public content: string) { super(id); }
  public move(dx: number, dy: number): void { this.x += dx; this.y += dy; }
  public scale(factor: number): void { this.x *= factor; this.y *= factor; }
  public describe(): string {
    const styles = this.styleDescription();
    return `text#${this.id} (${this.x},${this.y}) "${this.content}"${styles ? ` ${styles}` : ""}`;
  }

  public getAttribute(name: string): string | undefined {
    if (name === "x") return String(this.x);
    if (name === "y") return String(this.y);
    if (name === "text") return this.content;
    return super.getAttribute(name);
  }

  public setAttribute(name: string, value: string): void {
    if (name === "text") { this.content = value; return; }
    if (name === "x" || name === "y") {
      const number = Number(value);
      if (!Number.isFinite(number)) throw new Error(`attribute must be numeric: ${name}`);
      if (name === "x") this.x = number;
      else this.y = number;
      return;
    }
    if (!["fill", "stroke", "stroke-width"].includes(name)) throw new Error(`unknown attribute: ${name}`);
    super.setAttribute(name, value);
  }
}
