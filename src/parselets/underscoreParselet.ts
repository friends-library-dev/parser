import Node from '../nodes/AstNode';
import { Parselet, TOKEN as t, NODE as n } from '../types';

const underscore: Parselet = (parser, parent) => {
  if (parser.current.literal === `_` || parser.current.literal === `__`) {
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
  throw parser.throwError(`unexpected underscore token`);
};

export default underscore;

const emphasis: Parselet = (parser, parent) => {
  const open = parser.current;
  const node = new Node(n.EMPHASIS, parent, { startToken: open });
  parser.consume();
  node.children = parser.parseUntil(node, [t.UNDERSCORE, open.literal]);
  node.endToken = parser.current;
  parser.consumeClose([t.UNDERSCORE, open.literal], n.EMPHASIS, open);

  if (
    open.column.start === 1 &&
    (parent.hasClass(`discourse-part`) || parent.parent.hasClass(`discourse-part`)) &&
    node.children.length === 1 &&
    node.children[0]?.type === n.TEXT
  ) {
    const dpId = node.children[0];
    dpId.type = n.DISCOURSE_PART_IDENTIFIER;
    dpId.parent = parent;
    return dpId;
  }
  return node;
};
