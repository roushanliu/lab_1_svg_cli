import { Circle } from "../domain/Circle.js";
import { Ellipse } from "../domain/Ellipse.js";
import { Group } from "../domain/Group.js";
import { Line } from "../domain/Line.js";
import { Rect } from "../domain/Rect.js";
import type { Shape } from "../domain/Shape.js";
import { Text } from "../domain/Text.js";
import type { ShapeProvider } from "./ShapeProvider.js";

export class ShapeFactory {
  private readonly providers = new Map<string, ShapeProvider>();

  public constructor() {
    this.register({ type: "rect", create: (id, p) => new Rect(id, ...ShapeFactory.numbers(p, 4) as [number, number, number, number, string?]) });
    this.register({ type: "circle", create: (id, p) => new Circle(id, ...ShapeFactory.numbers(p, 3) as [number, number, number, string?]) });
    this.register({ type: "ellipse", create: (id, p) => new Ellipse(id, ...ShapeFactory.numbers(p, 4) as [number, number, number, number, string?]) });
    this.register({ type: "line", create: (id, p) => new Line(id, ...ShapeFactory.numbers(p, 4) as [number, number, number, number, string?]) });
    this.register({ type: "text", create: (id, p) => {
      if (p.length < 3) throw new Error("text requires x, y and content");
      return new Text(id, Number(p[0]), Number(p[1]), p.slice(2).join(" "));
    }});
    this.register({ type: "g", create: (id) => new Group(id) });
  }

  public register(provider: ShapeProvider): void { this.providers.set(provider.type, provider); }

  public create(type: string, id: string, parameters: readonly string[] = []): Shape {
    const provider = this.providers.get(type);
    if (!provider) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return provider.create(id, parameters);
  }

  private static numbers(parameters: readonly string[], required: number): (number | string)[] {
    if (parameters.length < required) throw new Error("not enough shape parameters");
    const values = parameters.slice(0, required).map(Number);
    if (values.some((value) => Number.isNaN(value))) throw new Error("shape parameter must be numeric");
    return [...values, ...parameters.slice(required)];
  }
}
