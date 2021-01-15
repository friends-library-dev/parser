import Node from '../nodes/AstNode';
import { Parselet, TOKEN as t, NODE as n } from '../types';

const underscore: Parselet = (parser, parent) => {
  if (parser.current.literal === `_`) {
    return emphasis(parser, parent);
  }

  if (parser.current.column.start !== 1 || !parser.peekIs(t.EOX)) {
    const redacted = parser.consume();
    return new Node(n.REDACTED, parent, {
      startToken: redacted,
      endToken: redacted,
      value: redacted.literal,
    });
  }

  throw parser.error(`unexpected underscore token`);
};

export default underscore;

const emphasis: Parselet = (parser, parent) => {
  const open = parser.current;
  const node = new Node(n.EMPHASIS, parent, { startToken: open });
  parser.consume();
  node.children = parser.parseUntil(node, [t.UNDERSCORE, `_`]);
  node.endToken = parser.current;
  parser.consumeClose([t.UNDERSCORE, `_`], n.EMPHASIS, open);
  return node;
};