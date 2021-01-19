import { AstNode, TOKEN as t, NODE as n } from '../types';
import Parser from '../Parser';
import Node from '../nodes/AstNode';

export default class DescriptionListParser {
  public constructor(private p: Parser) {}

  public peekStart(): boolean {
    if (this.p.current.column.start !== 1) {
      return false;
    }

    const guard = this.p.makeWhileGuard(`DescriptionListParser.peekStart()`);
    let distance = 1;
    let current = this.p.lookAhead(distance);
    while (guard() && !this.p.tokenIs(current, t.EOX)) {
      if (current.type === t.DOUBLE_COLON) {
        return true;
      }
      current = this.p.lookAhead(++distance);
    }

    return false;
  }

  public parse(parent: AstNode): AstNode {
    const list = new Node(n.DESCRIPTION_LIST, parent, { startToken: this.p.current });
    const guard = this.p.makeWhileGuard(`DescriptionListParser.parse()`);
    while (guard() && this.peekStart()) {
      const item = new Node(n.DESCRIPTION_LIST_ITEM, list, {
        startToken: this.p.current,
      });
      const term = new Node(n.DESCRIPTION_LIST_ITEM_TERM, item, {
        startToken: this.p.current,
      });
      term.children = this.p.parseUntil(term, t.DOUBLE_COLON);
      term.endToken = this.p.lastSignificantToken();
      this.p.consume(t.DOUBLE_COLON);

      if (this.p.currentIs(t.EOL)) {
        this.p.consume(t.EOL);
      } else {
        this.p.consume(t.WHITESPACE);
      }

      const content = new Node(n.DESCRIPTION_LIST_ITEM_CONTENT, item, {
        startToken: this.p.current,
      });
      content.children = this.p.parseUntilAnyOf(content, [t.DOUBLE_EOL], [t.EOL, t.EOF]);
      content.endToken = this.p.lastSignificantToken();

      item.children = [term, content];
      list.children.push(item);
      item.endToken = this.p.lastSignificantToken();

      this.p.consume(t.EOX);
    }
    list.endToken = this.p.lastSignificantToken();
    return list;
  }
}

/* 

List
Item
Term:: Content
*/
