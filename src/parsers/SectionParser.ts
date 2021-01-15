import { AstNode, NODE as n, TOKEN as t } from '../types';
import Parser from '../Parser';
import BlockParser from './BlockParser';
import Node from '../nodes/AstNode';

export default class SectionParser {
  public constructor(private p: Parser, public level: number) {}

  public parse(parent: AstNode): AstNode {
    const context = this.p.parseContext();
    const section = new Node(n.SECTION, parent, {
      level: this.level,
      context,
      startToken: this.p.current,
    });

    const level = this.p.current.literal.length;
    if (level !== this.level) {
      this.p.error(`expected heading level ${this.level}, got ${level}`);
    }

    const heading = this.p.parseHeading(section);
    section.children = [heading, ...this.parseBody(section)];
    section.endToken = this.p.lastSignificantToken();
    return section;
  }

  public parseBody(section: AstNode): AstNode[] {
    const nodes: AstNode[] = [];
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
