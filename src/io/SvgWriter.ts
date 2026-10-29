import { writeFile } from "node:fs/promises";
import type { Document } from "../domain/Document.js";

export class SvgWriter {
  public async write(filePath: string, document: Document): Promise<void> {
    void document;
    // SVG serialization is implemented after the domain model is validated.
    await writeFile(filePath, "", "utf8");
  }
}
