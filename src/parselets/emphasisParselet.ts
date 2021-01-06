import ChildNode from '../nodes/ChildNode';
import { Parselet, TOKEN as t, NODE as n } from '../types';

const emphasis: Parselet = (parser, parent) => {
  const node = new ChildNode(n.EMPHASIS, parent);
  parser.consume();
  node.children = parser.parseUntil(node, [t.UNDERSCORE, `_`]);
  parser.consume(t.UNDERSCORE, `_`);
  return node;
};

export default emphasis;
