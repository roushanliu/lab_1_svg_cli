import { readFileSync } from "node:fs";
import { XMLParser } from "fast-xml-parser";
import { ContainerShape } from "../domain/ContainerShape.js";
import { Document } from "../domain/Document.js";
import type { Shape } from "../domain/Shape.js";
import { ShapeFactory } from "../factory/ShapeFactory.js";

type XmlAttributes = Record<string, string>;
type XmlNode = Record<string, unknown>;

export class SvgReader {
  public warnings: string[] = [];
  private readonly factory: ShapeFactory;
  private readonly parser = new XMLParser({
    preserveOrder: true,
    ignoreAttributes: false,
    attributeNamePrefix: "",
    textNodeName: "#text",
    trimValues: false,
  });

  public constructor(
    private readonly warningSink: (message: string) => void = (message) => console.warn(message),
    factory = new ShapeFactory(),
  ) {
    this.factory = factory;
  }

  public read(filePath: string): Document {
    this.warnings = [];
    let source: string;
    try {
      source = readFileSync(filePath, "utf8");
    } catch {
      throw new Error(`cannot read file: ${filePath}`);
    }
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
    const parameterReaders: Record<string, () => readonly string[]> = {
      g: () => [],
      rect: () => [
        this.requiredNumber(attributes.x, "x").toString(),
        this.requiredNumber(attributes.y, "y").toString(),
        this.requiredNumber(attributes.width, "width").toString(),
        this.requiredNumber(attributes.height, "height").toString(),
      ],
      circle: () => [
        this.requiredNumber(attributes.cx, "cx").toString(),
        this.requiredNumber(attributes.cy, "cy").toString(),
        this.requiredNumber(attributes.r, "r").toString(),
      ],
      ellipse: () => [
        this.requiredNumber(attributes.cx, "cx").toString(),
        this.requiredNumber(attributes.cy, "cy").toString(),
        this.requiredNumber(attributes.rx, "rx").toString(),
        this.requiredNumber(attributes.ry, "ry").toString(),
      ],
      line: () => [
        this.requiredNumber(attributes.x1, "x1").toString(),
        this.requiredNumber(attributes.y1, "y1").toString(),
        this.requiredNumber(attributes.x2, "x2").toString(),
        this.requiredNumber(attributes.y2, "y2").toString(),
      ],
      text: () => [
        this.requiredNumber(attributes.x, "x").toString(),
        this.requiredNumber(attributes.y, "y").toString(),
        this.textContent(node),
      ],
    };
    const readParameters = parameterReaders[tag];
    if (!readParameters) throw new Error(`unknown shape type: ${tag}`);
    return style(this.factory.create(tag, id, readParameters()));
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
