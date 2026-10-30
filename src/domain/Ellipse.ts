import { Shape } from "./Shape.js";

export class Ellipse extends Shape {
  public readonly type = "ellipse";
  public constructor(id: string, public cx: number, public cy: number, public rx: number, public ry: number, fill?: string) {
    super(id);
    if (fill !== undefined) this.setAttribute("fill", fill);
  }
  public move(dx: number, dy: number): void { this.cx += dx; this.cy += dy; }
  public scale(factor: number): void { this.cx *= factor; this.cy *= factor; this.rx *= factor; this.ry *= factor; }
  public positionSummary(): string { return `(${this.cx},${this.cy})`; }
  public describe(): string {
    const styles = this.styleDescription();
    return `ellipse#${this.id} cx=${this.cx} cy=${this.cy} rx=${this.rx} ry=${this.ry}${styles ? ` ${styles}` : ""}`;
  }

  public toSvg(indent = 0): string {
    const spaces = " ".repeat(indent);
    return `${spaces}<ellipse id="${Shape.escapeXml(this.id)}" cx="${this.cx}" cy="${this.cy}" rx="${this.rx}" ry="${this.ry}"${this.svgStyleAttributes()}/>`;
  }

  public getAttribute(name: string): string | undefined {
    if (name === "cx") return String(this.cx);
    if (name === "cy") return String(this.cy);
    if (name === "rx") return String(this.rx);
    if (name === "ry") return String(this.ry);
    return super.getAttribute(name);
  }

  public setAttribute(name: string, value: string): void {
    if (["cx", "cy", "rx", "ry"].includes(name)) {
      const number = Number(value);
      if (!Number.isFinite(number)) throw new Error(`attribute must be numeric: ${name}`);
      if (name === "cx") this.cx = number;
      else if (name === "cy") this.cy = number;
      else if (name === "rx") this.rx = number;
      else this.ry = number;
      return;
    }
    if (!["fill", "stroke", "stroke-width"].includes(name)) throw new Error(`unknown attribute: ${name}`);
    super.setAttribute(name, value);
  }
}
