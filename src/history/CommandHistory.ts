import type { Command } from "../commands/Command.js";

export class CommandHistory {
  private readonly undoStack: Command[] = [];
  private readonly redoStack: Command[] = [];
  private locked = false;

  public execute(command: Command): string {
    const result = command.execute();
    this.undoStack.push(command);
    this.redoStack.length = 0;
    this.locked = false;
    return result;
  }

  public undo(): string {
    if (this.locked) throw new Error("undo not allowed after io command");
    const command = this.undoStack.pop();
    if (!command) return "nothing to undo";
    const result = command.undo();
    this.redoStack.push(command);
    return result;
  }

  public redo(): string {
    if (this.locked) throw new Error("redo not allowed after io command");
    const command = this.redoStack.pop();
    if (!command) return "nothing to redo";
    const result = command.execute();
    this.undoStack.push(command);
    return result;
  }

  public lockAfterDocumentCommand(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.locked = true;
  }
}
