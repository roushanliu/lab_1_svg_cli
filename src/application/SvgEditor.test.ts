import { describe, expect, it } from "vitest";
import { SvgEditor } from "./SvgEditor.js";

describe("SvgEditor first command loop", () => {
  it("creates a rectangle, shows it in the tree, and undoes it", () => {
    const editor = new SvgEditor();

    expect(editor.dispatch({ name: "init", arguments: ["400", "200"] })).toBe("canvas 400x200 created");
    expect(editor.dispatch({ name: "create", arguments: ["rect", "r1", "10", "20", "100", "50", "red"] })).toBe("create completed");
    expect(editor.dispatch({ name: "tree", arguments: [] })).toContain("rect#r1 x=10 y=20 w=100 h=50");

    editor.dispatch({ name: "undo", arguments: [] });
    expect(editor.dispatch({ name: "tree", arguments: [] })).toBe("svg (400x200)");
  });

  it("clears edit history when a new document is initialized", () => {
    const editor = new SvgEditor();
    editor.dispatch({ name: "init", arguments: [] });
    editor.dispatch({ name: "create", arguments: ["rect", "r1", "0", "0", "10", "10"] });
    editor.dispatch({ name: "init", arguments: ["100", "100"] });

    expect(() => editor.dispatch({ name: "undo", arguments: [] })).toThrow("undo not allowed after io command");
    expect(editor.dispatch({ name: "tree", arguments: [] })).toBe("svg (100x100)");
  });
});
