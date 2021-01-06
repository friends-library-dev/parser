import ChildNode from '../nodes/ChildNode';
import { Parselet, TOKEN as t, NODE as n } from '../types';

const strong: Parselet = (parser, parent) => {
  const open = parser.current;
  const node = new ChildNode(n.STRONG, parent);
  parser.consume();
  node.children = parser.parseUntil(node, t.DOUBLE_ASTERISK);
  parser.consumeClose(t.DOUBLE_ASTERISK, n.STRONG, open);
  return node;
};

export default strong;
