import type { Shape } from "../domain/Shape.js";

export interface ShapeProvider {
  readonly type: string;
  create(id: string, parameters: readonly string[]): Shape;
}
