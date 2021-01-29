import { toArabic, toRoman } from 'roman-numerals';
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

    if (this.hasSequenceIdentifier()) {
      this.parseSequenceIdentifier(heading);
    }

    if (this.p.currentIs(t.EOX)) {
      this.p.consume(t.EOX);
      return heading;
    }

    const title = new Node(n.HEADING_TITLE, heading);
    title.startToken = this.p.current;
    heading.children.push(title);

    if (this.isSegmented()) {
      this.parseSegmented(title);
    } else {
      title.children = this.p.parseUntil(heading, t.EOX);
    }

    title.endToken = this.p.lastSignificantToken();
    heading.endToken = this.p.lastSignificantToken();
    this.p.consume(t.EOX);
    return heading;
  }

  private parseSequenceIdentifier(heading: AstNode): void {
    const node = new Node(n.HEADING_SEQUENCE_IDENTIFIER, heading);
    heading.children.push(node);
    node.startToken = this.p.consume(t.TEXT);
    node.setMetaData(`kind`, node.startToken.literal);
    this.p.consume(t.WHITESPACE);
    const numberToken = this.p.consume(t.TEXT);
    node.endToken = numberToken;
    node.value = `${node.startToken.literal} ${numberToken.literal}`;
    if (this.p.currentOneOf(t.DOT, t.COLON)) {
      node.endToken = this.p.current;
      node.value += this.p.consume().literal;
    }

    if (numberToken.literal.match(/^\d/)) {
      node.setMetaData(`number`, Number(numberToken.literal));
    } else {
      node.setMetaData(`number`, toArabic(numberToken.literal));
    }
    node.setMetaData(`roman`, toRoman(node.getMetaData(`number`) as number));

    if (this.p.currentIs([t.WHITESPACE, ` `])) {
      this.p.consume();
    }
    heading.endToken = this.p.lastSignificantToken();
  }

  private hasSequenceIdentifier(): boolean {
    if (!this.p.peekTokens(t.TEXT, [t.WHITESPACE, ` `], t.TEXT)) {
      return false;
    }

    if (!this.p.current.literal.match(/^(chapter|section|capítulo|sección)$/i)) {
      return false;
    }

    if (!this.p.lookAhead(2).literal.match(/^(([1-9]+[0-9]*)|([ivxlcdm]+))$/i)) {
      return false;
    }

    return true;
  }

  private isSegmented(): boolean {
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

  private parseSegmented(title: AstNode): void {
    const delim: TokenSpec[] = [
      [t.WHITESPACE, ` `],
      t.FORWARD_SLASH,
      [t.WHITESPACE, ` `],
    ];
    const guard = this.p.makeWhileGuard(`HeadingParser.parseOldStyle()`);
    let level = 1;
    while (guard() && !this.p.peekTokensAnyOf(delim, [t.EOX])) {
      const osLine = new Node(n.HEADING_SEGMENT, title, {
        level: level++,
        startToken: this.p.current,
      });
      osLine.children = this.p.parseUntilAnyOf(osLine, delim, [t.EOX]);
      osLine.endToken = this.p.lastSignificantToken();
      title.children.push(osLine);
      if (this.p.peekTokens(...delim)) {
        this.p.consumeMany(t.WHITESPACE, t.FORWARD_SLASH, t.WHITESPACE);
      }
    }
  }
}
