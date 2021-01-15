import { AstNode, TOKEN as t, NODE as n, TokenSpec } from '../types';
import Parser from '../Parser';
import Node from '../nodes/AstNode';

export default class HeadingParser {
  public constructor(private p: Parser) {}

  public parse(parent: AstNode): AstNode {
    const headingContext = this.p.parseContext();
    const heading = new Node(n.HEADING, parent, {
      level: this.p.current.literal.length,
      context: headingContext,
      startToken: this.p.current,
    });
    this.p.consumeMany(t.EQUALS, t.WHITESPACE);

    if (this.isOldStyle()) {
      this.parseOldStyle(heading);
    } else {
      heading.children = this.p.parseUntil(heading, t.EOX);
    }
    heading.endToken = this.p.lastSignificantToken();
    this.p.consume(t.EOX);
    return heading;
  }

  private isOldStyle(): boolean {
    const guard = this.p.makeWhileGuard(`HeadingParser.isOldStyle()`);
    let index = 0;
    let current = this.p.lookAhead(index++);
    while (guard() && !this.p.tokenIs(current, t.EOX)) {
      if (current.type === t.FORWARD_SLASH) {
        return true;
      }
      current = this.p.lookAhead(index++);
    }
    return false;
  }

  private parseOldStyle(heading: AstNode) {
    const delim: TokenSpec[] = [
      [t.WHITESPACE, ` `],
      t.FORWARD_SLASH,
      [t.WHITESPACE, ` `],
    ];
    const guard = this.p.makeWhileGuard(`HeadingParser.parseOldStyle()`);
    let level = 1;
    while (guard() && !this.p.peekTokensAnyOf(delim, [t.EOX])) {
      const osLine = new Node(n.OLD_STYLE_LINE, heading, {
        level: level++,
        startToken: this.p.current,
      });
      osLine.children = this.p.parseUntilAnyOf(osLine, delim, [t.EOX]);
      osLine.endToken = this.p.lastSignificantToken();
      heading.children.push(osLine);
      if (this.p.peekTokens(...delim)) {
        this.p.consumeMany(t.WHITESPACE, t.FORWARD_SLASH, t.WHITESPACE);
      }
    }
  }
}
