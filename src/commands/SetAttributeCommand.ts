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

  public execute(): string {
    this.shape.setAttribute(this.attribute, this.value);
    return `${this.shape.type}#${this.shape.id} updated: ${this.attribute}=${this.formatValue(this.value)}`;
  }

  public undo(): string {
    if (this.previousValue === undefined) this.shape.removeAttribute(this.attribute);
    else this.shape.setAttribute(this.attribute, this.previousValue);
    const value = this.previousValue === undefined ? "<unset>" : this.formatValue(this.previousValue);
    return `${this.shape.type}#${this.shape.id} updated: ${this.attribute}=${value}`;
  }

  private formatValue(value: string): string { return this.attribute === "text" ? `"${value}"` : value; }
}
