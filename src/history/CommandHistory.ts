import type { Command } from "../commands/Command.js";

export class CommandHistory {
  private readonly undoStack: Command[] = [];
  private readonly redoStack: Command[] = [];
  private locked = false;

  public execute(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack.length = 0;
    this.locked = false;
  }

  public undo(): void {
    if (this.locked) throw new Error("undo not allowed after io command");
    const command = this.undoStack.pop();
    if (!command) return;
    command.undo();
    this.redoStack.push(command);
  }

  public redo(): void {
    if (this.locked) throw new Error("redo not allowed after io command");
    const command = this.redoStack.pop();
    if (!command) return;
    command.execute();
    this.undoStack.push(command);
  }

  public lockAfterDocumentCommand(): void { this.locked = true; }
}
