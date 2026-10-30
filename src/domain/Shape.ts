import type { ContainerShape } from "./ContainerShape.js";

export abstract class Shape {
  private parentShape?: ContainerShape;
  private readonly attributes = new Map<string, string>();

  protected constructor(public readonly id: string) {}

  public abstract readonly type: string;

  public get parent(): ContainerShape | undefined {
    return this.parentShape;
  }

  public setParent(parent: ContainerShape | undefined): void {
    this.parentShape = parent;
  }

  public setAttribute(name: string, value: string): void {
    if (!["fill", "stroke", "stroke-width"].includes(name)) {
      throw new Error(`unknown attribute: ${name}`);
    }
    this.attributes.set(name, value);
  }

  public removeAttribute(name: string): void {
    this.attributes.delete(name);
  }

  public getAttribute(name: string): string | undefined {
    return this.attributes.get(name);
  }

  public get attributesSnapshot(): ReadonlyMap<string, string> {
    return this.attributes;
  }

  public abstract move(dx: number, dy: number): void;

  public abstract scale(factor: number): void;

  public positionSummary(): string | undefined { return undefined; }

  public abstract describe(): string;

  public abstract toSvg(indent?: number): string;

  protected svgStyleAttributes(): string {
    return [...this.attributes.entries()]
      .map(([name, value]) => ` ${name}="${Shape.escapeXml(value)}"`)
      .join("");
  }

  protected static escapeXml(value: string): string {
    return value.replaceAll("&", "&amp;").replaceAll("\"", "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  protected styleDescription(): string {
    return ["fill", "stroke", "stroke-width"]
      .map((name) => {
        const value = this.getAttribute(name);
        return value === undefined ? "" : `${name}=${value}`;
      })
      .filter(Boolean)
      .join(" ");
  }
}
