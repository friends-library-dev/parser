import Node from '../nodes/AstNode';
import { Parselet, TOKEN as t, NODE as n } from '../types';

const strong: Parselet = (parser, parent) => {
  const open = parser.current;
  const node = new Node(n.STRONG, parent);
  node.startToken = parser.consume(t.DOUBLE_ASTERISK);
  node.children = parser.parseUntil(node, t.DOUBLE_ASTERISK);
  node.endToken = parser.consumeClose(t.DOUBLE_ASTERISK, n.STRONG, open);
  return node;
};

export default strong;
