import { AstNode, NODE as n, TOKEN as t } from '../types';
import Parser from '../Parser';
import BlockParser from './BlockParser';
import Node from '../nodes/AstNode';

export default class SectionParser {
  public constructor(private p: Parser, public level: number) {}

  public parse(parent: AstNode): AstNode {
    const context = this.p.parseContext();
    const equals = this.p.consume(t.EQUALS);
    this.p.consume(t.WHITESPACE);

    const level = equals.literal.length;
    if (level !== this.level) {
      this.p.error(`expected heading level ${this.level}, got ${level}`);
    }

    const section = new Node(n.SECTION, parent, { level, context, startToken: equals });
    const heading = new Node(n.HEADING, section, { level, startToken: equals });
    heading.children = this.p.parseUntil(heading, t.DOUBLE_EOL);
    heading.endToken = this.p.lastNonEOX();
    section.children = [heading, ...this.parseBody(section)];
    section.endToken = this.p.lastNonEOX();
    return section;
  }

  public parseBody(section: AstNode): AstNode[] {
    const nodes: AstNode[] = [];
    this.p.consume(t.DOUBLE_EOL);
    const guard = this.p.makeWhileGuard(`SectionParser.parseBody()`);
    while (guard() && !this.p.currentOneOf(t.EOF, t.EOD)) {
      this.p.assertLineStart();
      const [afterContext] = this.p.firstTokensAfterOptionalContext();

      if (afterContext.type === t.EQUALS) {
        if (afterContext.literal.length === this.level) {
          // got to another heading of the same level
          // close this one up so the next can start
          return nodes;
        }
        const sectionParser = new SectionParser(this.p, this.level + 1);
        const subSection = sectionParser.parse(section);
        nodes.push(subSection);
      } else {
        const blockParser = new BlockParser(this.p);
        const block = blockParser.parse(section);
        nodes.push(block);
      }
    }
    return nodes;
  }
}
