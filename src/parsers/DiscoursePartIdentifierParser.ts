import { AstNode, TOKEN as t, NODE as n } from '../types';
import Parser from '../Parser';
import Node from '../nodes/AstNode';

export default class DiscoursePartIdentifierParser {
  protected terminators = [t.DOT, t.COLON];
  protected className = `discourse-part`;
  protected idStarters = [
    `question`,
    `pregunta`,
    `answer`,
    `respuesta`,
    `objection`,
    `objeción`,
    `inquiry`,
  ];

  public constructor(protected p: Parser) {}

  public parse(parent: AstNode): AstNode | null {
    if (!this.identifierPossible(parent)) {
      return null;
    }

    const firstWord = this.p.current.literal;
    if (!this.idStarters.includes(firstWord.toLowerCase())) {
      return null;
    }

    const node = new Node(n.DISCOURSE_PART_IDENTIFIER, parent);
    node.startToken = this.p.consume(t.TEXT);
    node.value = node.startToken.literal;

    if (this.consumeTerminator(node)) {
      return node;
    }

    if (
      this.p.currentIs(t.WHITESPACE) &&
      this.p.peekIs(t.TEXT) &&
      this.p.peek.literal.match(/^\d+$/)
    ) {
      node.value += this.p.consume().literal;
      node.value += this.p.current.literal;
      node.endToken = this.p.consume();
    }

    this.consumeTerminator(node);

    return node;
  }

  protected consumeTerminator(node: AstNode): boolean {
    if (this.p.currentOneOf(...this.terminators)) {
      node.value += this.p.current.literal;
      node.endToken = this.p.consume();
      return true;
    }
    return false;
  }

  protected identifierPossible(parent: AstNode): boolean {
    if (this.p.current.column.start !== 1 || this.p.current.type !== n.TEXT) {
      return false;
    }

    if (!parent.hasClass(this.className) && !parent.parent.hasClass(this.className)) {
      return false;
    }

    return true;
  }
}
