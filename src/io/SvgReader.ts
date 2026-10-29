import { readFile } from "node:fs/promises";
import { Document } from "../domain/Document.js";

export class SvgReader {
  public async read(filePath: string): Promise<Document> {
    const source = await readFile(filePath, "utf8");
    void source;
    // XML parsing and missing-id assignment are implemented in the next slice.
    throw new Error("SVG reader not implemented yet");
  }
}
