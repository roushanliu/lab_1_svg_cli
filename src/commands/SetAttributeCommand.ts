import type { Document } from "../domain/Document.js";
import type { Command } from "./Command.js";

export class SetAttributeCommand implements Command {
  public readonly name = "set";
  private readonly shape;
  private readonly previousValue: string | undefined;

  public constructor(document: Document, id: string, private readonly attribute: string, private readonly value: string) {
    this.shape = document.requireShape(id);
    this.previousValue = this.shape.getAttribute(attribute);
  }

  public execute(): void { this.shape.setAttribute(this.attribute, this.value); }

  public undo(): void {
    if (this.previousValue === undefined) this.shape.removeAttribute(this.attribute);
    else this.shape.setAttribute(this.attribute, this.previousValue);
  }
}
