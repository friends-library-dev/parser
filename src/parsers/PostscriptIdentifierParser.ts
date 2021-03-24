import { AstNode, TOKEN as t, NODE as n } from '../types';
import Node from '../nodes/AstNode';
import DiscoursePartIdentifierParser from './DiscoursePartIdentifierParser';

export default class PostscriptIdentifierParser extends DiscoursePartIdentifierParser {
  // protected terminators = [t.DOT, t.C];
  protected className = `postscript`;
  protected idStarters = [
    `PS`,
    `Postscript`,
    `PostScript`,
    `PD`,
    `NB`,
    `Posdata`,
    `PosData`,
  ];

  public parse(parent: AstNode): AstNode | null {
    if (!this.identifierPossible(parent)) {
      return null;
    }

    const fullWordNode = this.parseFullWord(parent);
    if (fullWordNode) {
      return fullWordNode;
    }

    const abbrevNode = this.parseAbbrev(parent);
    if (abbrevNode) {
      return abbrevNode;
    }

    return null;
  }

  protected parseAbbrev(parent: AstNode): AstNode | null {
    const peekText = this.p.peekJoinedLiterals(8);
    const match = peekText.match(/(P|N)(?:\+\+\+)?\.(?:\+\+\+)? ?(S|D|B)(?:\.)?/);
    if (!match) {
      return null;
    }

    // reject stuff like P. B. or N. S.
    if (![`PS`, `PD`, `NB`].includes(`${match[1]}${match[2]}`)) {
      return null;
    }

    const node = new Node(n.POSTSCRIPT_IDENTIFIER, parent);
    node.startToken = this.p.current;

    let numConsumedChars = 0;
    while (numConsumedChars < (match[0] ?? ``).length) {
      const token = this.p.consume();
      node.endToken = token;
      numConsumedChars += token.literal.length;
      if (!this.p.tokenIs(token, t.TRIPLE_PLUS)) {
        node.value += token.literal;
      }
    }

    if (numConsumedChars !== (match[0] ?? ``).length) {
      this.p.throwError(`unexpected result creating postscript identifier`);
    }

    return node;
  }

  protected parseFullWord(parent: AstNode): AstNode | null {
    const firstWord = this.p.current.literal;
    if (!this.idStarters.includes(firstWord)) {
      return null;
    }

    const node = new Node(n.POSTSCRIPT_IDENTIFIER, parent);
    node.startToken = this.p.consume(t.TEXT);
    node.value = node.startToken.literal;
    if (node.value.length > 2) {
      node.value = node.startToken.literal.toLowerCase();
      node.value = [(node.value[0] ?? ``).toUpperCase(), ...node.value.slice(1)].join(``);
    }
    node.endToken = node.startToken;
    this.consumeTerminator(node);
    return node;
  }

  protected identifierPossible(parent: AstNode): boolean {
    if (!super.identifierPossible(parent)) {
      return false;
    }

    return !!this.p.current.literal.match(/^(P|N)/);
  }
}
