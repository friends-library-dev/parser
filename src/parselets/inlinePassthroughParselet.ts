import ChildNode from '../nodes/ChildNode';
import { Parselet, TOKEN as t, NODE as n } from '../types';

const inlinePassThrough: Parselet = (parser, parent) => {
  const node = new ChildNode(n.INLINE_PASSTHROUGH, parent);
  parser.consume(t.TRIPLE_PLUS);
  const guard = parser.makeWhileGuard(`inlinePassthroughParselet()`);
  while (guard() && !parser.currentOneOf(t.EOL, t.TRIPLE_PLUS)) {
    node.value += parser.consume().literal;
  }
  if (!parser.currentIs(t.TRIPLE_PLUS)) {
    parser.error(`unclosed inline passthrough`);
  }
  parser.consume(t.TRIPLE_PLUS);
  return node;
};

export default inlinePassThrough;
