export interface Command {
  readonly name: string;
  execute(): string;
  undo(): string;
}
