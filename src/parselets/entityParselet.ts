import Node from '../nodes/AstNode';
import Parser from '../Parser';
import { Parselet, NODE as n, ENTITY, EntityType } from '../types';

const entity: Parselet = (parser, parent) => {
  const current = parser.current;
  const node = new Node(n.ENTITY, parent, {
    subType: entityType(current.literal, parser),
    value: current.literal,
    startToken: current,
    endToken: current,
  });
  parser.consume();
  return node;
};

export default entity;

function entityType(tokenLiteral: string, parser: Parser): EntityType {
  switch (tokenLiteral) {
    case `&#8212;`:
      return ENTITY.EMDASH;
    case `&hellip;`:
      return ENTITY.ELLIPSES;
    case `&amp;`:
      return ENTITY.AMPERSAND;
    default:
      throw parser.error(`unknown entity type: ${tokenLiteral}`);
  }
}
