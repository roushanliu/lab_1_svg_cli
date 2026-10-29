import { Cli } from "./cli/Cli.js";
import { SvgEditor } from "./application/SvgEditor.js";

const editor = new SvgEditor();
const cli = new Cli(editor);

console.log("svg-editor 0.1 — type 'help' for commands");
await cli.run();
