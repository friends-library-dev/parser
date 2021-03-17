import Node from '../nodes/AstNode';
import Parser from '../Parser';
import { Parselet, NODE as n, ENTITY as e, EntityType, AstNode } from '../types';

const entity: Parselet = (parser, parent) => {
  const current = parser.current;
  const node = new Node(n.ENTITY, parent, {
    subType: entityType(current.literal, parser),
    value: current.literal,
    startToken: current,
    endToken: current,
  });
  setEntityMeta(node);
  parser.consume();
  return node;
};

export default entity;

function entityType(tokenLiteral: string, parser: Parser): EntityType {
  switch (tokenLiteral) {
    case `&#8212;`:
      return e.EMDASH;
    case `&hellip;`:
      return e.ELLIPSES;
    case `&amp;`:
      return e.AMPERSAND;
    default:
      throw parser.error(`unknown entity type: ${tokenLiteral}`);
  }
}

function setEntityMeta(node: AstNode): void {
  switch (node.meta.subType) {
    case e.EMDASH:
      node.setMetaData(`htmlEntity`, `&mdash;`);
      node.setMetaData(`decimalEntity`, `&#8212;`);
      break;
    case e.ELLIPSES:
      node.setMetaData(`htmlEntity`, `&hellip;`);
      node.setMetaData(`decimalEntity`, `&#8230;`);
      break;
    case e.AMPERSAND:
      node.setMetaData(`htmlEntity`, `&amp;`);
      node.setMetaData(`decimalEntity`, `&#38;`);
      break;
  }
}
