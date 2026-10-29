import { ContainerShape } from "./ContainerShape.js";

export class Group extends ContainerShape {
  public readonly type = "g";

  public constructor(id: string) {
    super(id);
  }
}
