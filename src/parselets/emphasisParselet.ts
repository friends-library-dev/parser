import ChildNode from '../nodes/ChildNode';
import { Parselet, TOKEN as t, NODE as n } from '../types';

const emphasis: Parselet = (parser, parent) => {
  const open = parser.current;
  const node = new ChildNode(n.EMPHASIS, parent);
  parser.consume();
  node.children = parser.parseUntil(node, [t.UNDERSCORE, `_`]);
  try {
    parser.consume(t.UNDERSCORE, `_`);
  } catch {
    let err = [
      `Parse error: unclosed \`${n.EMPHASIS}\` node, opened at `,
      `${open.filename ? `${open.filename}:` : ``}`,
      `${open.line}:${open.column.start}`,
    ].join(``);
    throw new Error(err);
  }
  return node;
};

export default emphasis;
