import Node from '../nodes/AstNode';
import { Parselet, NODE as n } from '../types';

const symbol: Parselet = (parser, parent) => {
  const current = parser.current;
  const node = new Node(n.SYMBOL, parent, {
    subType: current.type,
    value: current.literal,
  });
  parser.consume();
  return node;
};

export default symbol;
