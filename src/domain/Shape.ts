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

  public abstract describe(): string;

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
