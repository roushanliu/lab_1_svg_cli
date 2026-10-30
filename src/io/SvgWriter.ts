import { writeFileSync } from "node:fs";
import type { Document } from "../domain/Document.js";

export class SvgWriter {
  public write(filePath: string, document: Document): void {
    writeFileSync(filePath, document.toSvg(), "utf8");
  }
}
