export class Tokenizer {
  public tokenize(line: string): string[] {
    if (line.trimStart().startsWith("#")) return [];
    const tokens: string[] = [];
    let current = "";
    let quoted = false;
    for (const character of line.trim()) {
      if (character === '"') { quoted = !quoted; continue; }
      if (!quoted && /\s/.test(character)) {
        if (current) { tokens.push(current); current = ""; }
      } else current += character;
    }
    if (current) tokens.push(current);
    if (quoted) throw new Error("unterminated quote");
    return tokens;
  }
}
