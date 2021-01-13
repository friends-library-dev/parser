import Node from '../nodes/AstNode';
import { Parselet, TOKEN as t, NODE as n } from '../types';

const emphasis: Parselet = (parser, parent) => {
  const open = parser.current;
  const node = new Node(n.EMPHASIS, parent);
  parser.consume();
  node.children = parser.parseUntil(node, [t.UNDERSCORE, `_`]);
  parser.consumeClose([t.UNDERSCORE, `_`], n.EMPHASIS, open);
  return node;
};

export default emphasis;
