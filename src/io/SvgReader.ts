import { readFileSync } from "node:fs";
import { XMLParser } from "fast-xml-parser";
import { Circle } from "../domain/Circle.js";
import { ContainerShape } from "../domain/ContainerShape.js";
import { Document } from "../domain/Document.js";
import { Ellipse } from "../domain/Ellipse.js";
import { Group } from "../domain/Group.js";
import { Line } from "../domain/Line.js";
import { Rect } from "../domain/Rect.js";
import { Text } from "../domain/Text.js";
import type { Shape } from "../domain/Shape.js";

type XmlAttributes = Record<string, string>;
type XmlNode = Record<string, unknown>;

export class SvgReader {
  public warnings: string[] = [];
  private readonly parser = new XMLParser({
    preserveOrder: true,
    ignoreAttributes: false,
    attributeNamePrefix: "",
    textNodeName: "#text",
    trimValues: false,
  });

  public constructor(private readonly warningSink: (message: string) => void = (message) => console.warn(message)) {}

  public read(filePath: string): Document {
    this.warnings = [];
    const source = readFileSync(filePath, "utf8");
    const parsed = this.parser.parse(source) as XmlNode[];
    const root = parsed.find((node) => Array.isArray(node.svg));
    if (!root) throw new Error(`invalid SVG document: ${filePath}`);
    const attributes = (root[":@"] ?? {}) as XmlAttributes;
    const document = new Document(this.number(attributes.width, 800), this.number(attributes.height, 600));
    const children = root.svg as XmlNode[];
    for (const child of children) this.readShape(child, document);
    return document;
  }

  private readShape(node: XmlNode, document: Document, parent?: ContainerShape): void {
    const tag = Object.keys(node).find((key) => key !== ":@" && key !== "#text");
    if (!tag) return;
    const attributes = (node[":@"] ?? {}) as XmlAttributes;
    const id = attributes.id ?? this.assignId(tag, document);
    const shape = this.createShape(tag, id, attributes, node);
    document.addShape(shape, parent);
    if (shape instanceof ContainerShape) {
      const children = (node[tag] ?? []) as XmlNode[];
      for (const child of children) this.readShape(child, document, shape);
    }
  }

  private createShape(tag: string, id: string, attributes: XmlAttributes, node: XmlNode): Shape {
    const style = (shape: Shape): Shape => {
      for (const name of ["fill", "stroke", "stroke-width"]) if (attributes[name] !== undefined) shape.setAttribute(name, attributes[name]);
      return shape;
    };
    switch (tag) {
      case "g": return style(new Group(id));
      case "rect": return style(new Rect(id, this.requiredNumber(attributes.x, "x"), this.requiredNumber(attributes.y, "y"), this.requiredNumber(attributes.width, "width"), this.requiredNumber(attributes.height, "height")));
      case "circle": return style(new Circle(id, this.requiredNumber(attributes.cx, "cx"), this.requiredNumber(attributes.cy, "cy"), this.requiredNumber(attributes.r, "r")));
      case "ellipse": return style(new Ellipse(id, this.requiredNumber(attributes.cx, "cx"), this.requiredNumber(attributes.cy, "cy"), this.requiredNumber(attributes.rx, "rx"), this.requiredNumber(attributes.ry, "ry")));
      case "line": return style(new Line(id, this.requiredNumber(attributes.x1, "x1"), this.requiredNumber(attributes.y1, "y1"), this.requiredNumber(attributes.x2, "x2"), this.requiredNumber(attributes.y2, "y2")));
      case "text": return style(new Text(id, this.requiredNumber(attributes.x, "x"), this.requiredNumber(attributes.y, "y"), this.textContent(node)));
      default: throw new Error(`unknown shape type: ${tag}`);
    }
  }

  private assignId(tag: string, document: Document): string {
    let index = 1;
    let id = `${tag}${index}`;
    while (document.find(id)) id = `${tag}${++index}`;
    const warning = `warning: assigned id ${id} to unnamed <${tag}>`;
    this.warnings.push(warning);
    this.warningSink(warning);
    return id;
  }

  private textContent(node: XmlNode): string {
    const children = (node.text ?? []) as XmlNode[];
    return children.filter((child) => typeof child["#text"] === "string").map((child) => child["#text"] as string).join("");
  }

  private number(value: string | undefined, fallback: number): number {
    const parsed = Number.parseFloat(value ?? "");
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private requiredNumber(value: string | undefined, name: string): number {
    const parsed = Number.parseFloat(value ?? "");
    if (!Number.isFinite(parsed)) throw new Error(`invalid SVG attribute: ${name}`);
    return parsed;
  }
}
