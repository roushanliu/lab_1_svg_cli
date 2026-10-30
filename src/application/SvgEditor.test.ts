import { describe, expect, it } from "vitest";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SvgEditor } from "./SvgEditor.js";
import { CommandParser } from "../parser/CommandParser.js";

describe("SvgEditor first command loop", () => {
  it("creates a rectangle, shows it in the tree, and undoes it", () => {
    const editor = new SvgEditor();

    expect(editor.dispatch({ name: "init", arguments: ["400", "200"] })).toBe("canvas 400x200 created");
    expect(editor.dispatch({ name: "create", arguments: ["rect", "r1", "10", "20", "100", "50", "red"] })).toBe("rect#r1 created");
    expect(editor.dispatch({ name: "tree", arguments: [] })).toContain("rect#r1 x=10 y=20 w=100 h=50");
    expect(editor.dispatch({ name: "tree", arguments: ["r1"] })).toBe("rect#r1 x=10 y=20 w=100 h=50 fill=red");

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

    expect(editor.dispatch({ name: "move", arguments: ["r1", "5", "-10"] })).toBe("rect#r1 moved to (15,10)");
    expect(editor.dispatch({ name: "tree", arguments: [] })).toContain("x=15 y=10");
    expect(editor.dispatch({ name: "undo", arguments: [] })).toBe("rect#r1 moved back to (10,20)");
    expect(editor.dispatch({ name: "tree", arguments: [] })).toContain("x=10 y=20");

    expect(editor.dispatch({ name: "scale", arguments: ["r1", "2"] })).toBe("rect#r1 scaled by 2");
    expect(editor.dispatch({ name: "tree", arguments: [] })).toContain("x=20 y=40 w=200 h=100");
    expect(editor.dispatch({ name: "set", arguments: ["r1", "fill", "blue"] })).toBe("rect#r1 updated: fill=blue");
    expect(editor.document.requireShape("r1").getAttribute("fill")).toBe("blue");
    expect(editor.dispatch({ name: "undo", arguments: [] })).toBe("rect#r1 updated: fill=red");
    expect(editor.document.requireShape("r1").getAttribute("fill")).toBe("red");

    expect(editor.dispatch({ name: "delete", arguments: ["r1"] })).toBe("rect#r1 deleted");
    expect(editor.dispatch({ name: "tree", arguments: [] })).toBe("svg (800x600)");
    expect(editor.dispatch({ name: "undo", arguments: [] })).toBe("rect#r1 restored");
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

  it("treats a color beginning with # as a value, while a line-leading # is a comment", () => {
    const parser = new CommandParser();
    expect(parser.parse("# comment")).toBeUndefined();
    expect(parser.parse("create rect r1 0 0 10 10 #4a90d9")?.arguments.at(-1)).toBe("#4a90d9");
  });

  it("reports a missing create parent as a missing container", () => {
    const editor = new SvgEditor();
    editor.dispatch({ name: "init", arguments: [] });
    expect(() => editor.dispatch({ name: "create", arguments: ["rect", "r1", "0", "0", "10", "10", "in", "node9"] }))
      .toThrow("no such container: node9");
  });

  it("shows details, resizes the canvas, prints help, and saves SVG", () => {
    const editor = new SvgEditor();
    editor.dispatch({ name: "init", arguments: ["320", "180"] });
    editor.dispatch({ name: "create", arguments: ["rect", "r1", "10", "20", "100", "50", "red"] });

    expect(editor.dispatch({ name: "show", arguments: ["r1"] })).toContain("parent=svg");
    expect(editor.dispatch({ name: "canvas", arguments: [] })).toBe("320x180");
    expect(editor.dispatch({ name: "canvas", arguments: ["640", "360"] })).toBe("canvas 640x360 updated");
    expect(editor.dispatch({ name: "help", arguments: [] })).toContain("save [file.svg]");

    const filePath = join(tmpdir(), `svg-editor-${Date.now()}.svg`);
    editor.dispatch({ name: "save", arguments: [filePath] });
    const svg = readFileSync(filePath, "utf8");
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"');
    expect(svg).toContain('<rect id="r1" x="10" y="20" width="100" height="50" fill="red"/>');
    unlinkSync(filePath);
  });

  it("reads nested SVG, assigns missing ids, and preserves the tree", () => {
    const filePath = join(tmpdir(), `svg-reader-${Date.now()}.svg`);
    writeFileSync(filePath, `<?xml version="1.0"?><svg width="400" height="300"><rect x="0" y="0" width="400" height="300" fill="#fff"/><g id="scene"><circle cx="20" cy="30" r="10"/></g><text id="label" x="10" y="290">hello</text></svg>`, "utf8");
    const editor = new SvgEditor();
    const result = editor.dispatch({ name: "read", arguments: [filePath] }) ?? "";

    expect(result).toContain("warning: assigned id rect1 to unnamed <rect>");
    expect(result).toContain("read ");
    expect(editor.dispatch({ name: "tree", arguments: [] })).toContain("g#scene");
    expect(editor.dispatch({ name: "tree", arguments: [] })).toContain("circle#circle1");
    expect(editor.dispatch({ name: "show", arguments: ["label"] })).toContain('"hello"');
    unlinkSync(filePath);
  });

  it("round-trips a saved SVG through the reader", () => {
    const filePath = join(tmpdir(), `svg-roundtrip-${Date.now()}.svg`);
    const writer = new SvgEditor();
    writer.dispatch({ name: "init", arguments: ["200", "100"] });
    writer.dispatch({ name: "create", arguments: ["g", "scene"] });
    writer.dispatch({ name: "create", arguments: ["text", "label", "10", "20", "hello", "in", "scene"] });
    writer.dispatch({ name: "save", arguments: [filePath] });

    const reader = new SvgEditor();
    reader.dispatch({ name: "read", arguments: [filePath] });
    expect(reader.dispatch({ name: "tree", arguments: [] })).toContain("g#scene");
    expect(reader.dispatch({ name: "show", arguments: ["label"] })).toContain('"hello"');
    unlinkSync(filePath);
  });
});
