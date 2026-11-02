import { writeFileSync } from "node:fs";
import type { Document } from "../domain/Document.js";

export class SvgWriter {
  public write(filePath: string, document: Document): void {
    try {
      writeFileSync(filePath, document.toSvg(), "utf8");
    } catch {
      throw new Error(`cannot write file: ${filePath}`);
    }
  }
}
