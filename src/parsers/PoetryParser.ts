import ChildNode from '../nodes/ChildNode';
import TextNode from '../nodes/TextNode';
import Parser from '../Parser';
import { AstChildNode, NODE as n, TOKEN as t } from '../types';

export default class PoetryParser {
  public constructor(private p: Parser) {}

  public parse(parent: AstChildNode): AstChildNode[] {
    const stanzas: AstChildNode[] = [];
    const guard = this.p.makeWhileGuard(`PoetryParser.parse()`);
    while (guard() && !this.p.peekTokensAnyOf([[t.UNDERSCORE, `____`]], [t.EOF, t.EOD])) {
      const stanza = new ChildNode(n.VERSE_STANZA, parent);
      stanza.children = this.parseLines(stanza);
      parent.children.push(stanza);
      stanzas.push(stanza);
      if (this.p.currentIs(t.DOUBLE_EOL)) {
        this.p.consume(t.DOUBLE_EOL);
      }
    }
    return stanzas;
  }

  private parseLines(stanza: AstChildNode): AstChildNode[] {
    const lines: AstChildNode[] = [];

    const guard = this.p.makeWhileGuard(`PoetryParser.parseLines()`);
    while (
      guard() &&
      !this.p.peekTokensAnyOf([t.DOUBLE_EOL], [[t.UNDERSCORE, `____`]], [t.EOF])
    ) {
      const line = new ChildNode(n.VERSE_LINE, stanza);
      line.children = this.parseLine(line);
      lines.push(line);
    }
    return lines;
  }

  private parseLine(line: AstChildNode): AstChildNode[] {
    // for now let's (only semi-naively) assume that verse lines don't contain other nodes
    const textNode = new TextNode(line, ``);
    const guard = this.p.makeWhileGuard(`PoetryParser.parseLine()`);
    while (guard() && !this.p.currentOneOf(t.EOL, t.DOUBLE_EOL)) {
      textNode.value += this.p.current.literal;
      this.p.consume();
    }
    if (this.p.currentIs(t.EOL)) {
      this.p.consume(t.EOL);
    }
    return [textNode];
  }
}
