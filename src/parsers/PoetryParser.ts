import { AstNode, NODE as n, TOKEN as t } from '../types';
import Node from '../nodes/AstNode';
import Parser from '../Parser';

export default class PoetryParser {
  public constructor(private p: Parser) {}

  public parse(parent: AstNode): AstNode[] {
    const stanzas: AstNode[] = [];
    const guard = this.p.makeWhileGuard(`PoetryParser.parse()`);
    while (guard() && !this.p.peekTokensAnyOf([[t.UNDERSCORE, `____`]], [t.EOF, t.EOD])) {
      const stanza = new Node(n.VERSE_STANZA, parent, { startToken: this.p.current });
      stanza.children = this.parseLines(stanza);
      parent.children.push(stanza);
      stanzas.push(stanza);
      stanza.endToken = this.p.lastNonEOX();
      if (this.p.currentIs(t.DOUBLE_EOL)) {
        this.p.consume(t.DOUBLE_EOL);
      }
    }
    return stanzas;
  }

  private parseLines(stanza: AstNode): AstNode[] {
    const lines: AstNode[] = [];
    const guard = this.p.makeWhileGuard(`PoetryParser.parseLines()`);
    while (
      guard() &&
      !this.p.peekTokensAnyOf([t.DOUBLE_EOL], [[t.UNDERSCORE, `____`]], [t.EOF])
    ) {
      const line = new Node(n.VERSE_LINE, stanza, { startToken: this.p.current });
      line.children = this.parseLine(line);
      lines.push(line);
      line.endToken = this.p.lastNonEOX();
    }
    return lines;
  }

  private parseLine(line: AstNode): AstNode[] {
    // for now let's (only semi-naively) assume that verse lines don't contain other nodes
    const textNode = new Node(n.TEXT, line, { startToken: this.p.current });
    const guard = this.p.makeWhileGuard(`PoetryParser.parseLine()`);
    while (guard() && !this.p.currentOneOf(t.EOL, t.DOUBLE_EOL)) {
      textNode.value += this.p.current.literal;
      this.p.consume();
    }
    textNode.endToken = this.p.lastNonEOX();
    if (this.p.currentIs(t.EOL)) {
      this.p.consume(t.EOL);
    }
    return [textNode];
  }
}
