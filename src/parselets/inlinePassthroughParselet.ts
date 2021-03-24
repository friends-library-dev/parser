import Node from '../nodes/AstNode';
import { Parselet, TOKEN as t, NODE as n } from '../types';

const inlinePassThrough: Parselet = (parser, parent) => {
  let node = new Node(n.INLINE_PASSTHROUGH, parent, { startToken: parser.current });
  parser.consume(t.TRIPLE_PLUS);
  const token = parser.consume(t.RAW_PASSTHROUGH);
  node.value = token.literal;
  if (token.literal.match(/^___+$/)) {
    node = new Node(n.REDACTED, parent, {
      startToken: node.startToken,
      value: node.value,
    });
  }
  if (!parser.currentIs(t.TRIPLE_PLUS)) {
    parser.throwError(`unclosed inline passthrough`);
  }
  node.endToken = parser.consume(t.TRIPLE_PLUS);
  return node;
};

export default inlinePassThrough;
