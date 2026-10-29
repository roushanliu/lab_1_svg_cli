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

  it("moves, scales, sets, deletes, and undoes edits", () => {
    const editor = new SvgEditor();
    editor.dispatch({ name: "init", arguments: [] });
    editor.dispatch({ name: "create", arguments: ["rect", "r1", "10", "20", "100", "50", "red"] });

    editor.dispatch({ name: "move", arguments: ["r1", "5", "-10"] });
    expect(editor.dispatch({ name: "tree", arguments: [] })).toContain("x=15 y=10");
    editor.dispatch({ name: "undo", arguments: [] });
    expect(editor.dispatch({ name: "tree", arguments: [] })).toContain("x=10 y=20");

    editor.dispatch({ name: "scale", arguments: ["r1", "2"] });
    expect(editor.dispatch({ name: "tree", arguments: [] })).toContain("x=20 y=40 w=200 h=100");
    editor.dispatch({ name: "set", arguments: ["r1", "fill", "blue"] });
    expect(editor.document.requireShape("r1").getAttribute("fill")).toBe("blue");
    editor.dispatch({ name: "undo", arguments: [] });
    expect(editor.document.requireShape("r1").getAttribute("fill")).toBe("red");

    editor.dispatch({ name: "delete", arguments: ["r1"] });
    expect(editor.dispatch({ name: "tree", arguments: [] })).toBe("svg (800x600)");
    editor.dispatch({ name: "undo", arguments: [] });
    expect(editor.dispatch({ name: "tree", arguments: [] })).toContain("rect#r1");
  });

  it("rejects invalid scale factors without changing the document", () => {
    const editor = new SvgEditor();
    editor.dispatch({ name: "init", arguments: [] });
    editor.dispatch({ name: "create", arguments: ["rect", "r1", "0", "0", "10", "10"] });

    expect(() => editor.dispatch({ name: "scale", arguments: ["r1", "0"] })).toThrow("scale factor must be positive");
    expect(editor.dispatch({ name: "tree", arguments: [] })).toContain("w=10 h=10");
  });

  it("groups children, moves the composite, and undoes the group as one unit", () => {
    const editor = new SvgEditor();
    editor.dispatch({ name: "init", arguments: [] });
    editor.dispatch({ name: "create", arguments: ["g", "scene"] });
    editor.dispatch({ name: "create", arguments: ["rect", "r1", "10", "20", "30", "40", "red", "in", "scene"] });
    editor.dispatch({ name: "create", arguments: ["circle", "c1", "100", "100", "10", "blue", "in", "scene"] });
    editor.dispatch({ name: "group", arguments: ["node", "c1", "r1"] });

    const groupedTree = editor.dispatch({ name: "tree", arguments: [] }) ?? "";
    expect(groupedTree).toContain("g#node");
    expect(groupedTree.indexOf("rect#r1")).toBeLessThan(groupedTree.indexOf("circle#c1"));
    editor.dispatch({ name: "move", arguments: ["node", "5", "6"] });
    expect(editor.dispatch({ name: "tree", arguments: [] })).toContain("x=15 y=26");
    editor.dispatch({ name: "undo", arguments: [] });
    expect(editor.dispatch({ name: "tree", arguments: [] })).toContain("x=10 y=20");

    editor.dispatch({ name: "ungroup", arguments: ["node"] });
    expect(editor.dispatch({ name: "tree", arguments: [] })).not.toContain("g#node");
    expect(editor.dispatch({ name: "tree", arguments: [] })).toContain("rect#r1");
  });

  it("moves an existing shape into a container and restores its parent on undo", () => {
    const editor = new SvgEditor();
    editor.dispatch({ name: "init", arguments: [] });
    editor.dispatch({ name: "create", arguments: ["g", "scene"] });
    editor.dispatch({ name: "create", arguments: ["rect", "r1", "0", "0", "10", "10"] });
    editor.dispatch({ name: "addto", arguments: ["scene", "r1"] });
    expect(editor.dispatch({ name: "tree", arguments: [] })).toContain("g#scene");
    editor.dispatch({ name: "undo", arguments: [] });
    const tree = editor.dispatch({ name: "tree", arguments: [] }) ?? "";
    expect(tree.indexOf("rect#r1")).toBeGreaterThan(tree.indexOf("svg (800x600)"));
    expect(tree).not.toContain("    └── rect#r1");
  });
});
