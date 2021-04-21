import Node from '../nodes/AstNode';
import { Parselet, NODE as n, TOKEN as t, TokenSpec } from '../types';

const entity: Parselet = (parser, parent) => {
  const current = parser.current;
  const node = new Node(n.XREF, parent, {
    value: current.literal,
    startToken: current,
    endToken: current,
  });

  parser.consume(t.XREF_OPEN);
  const targetId = parser.consume(t.TEXT).literal;
  const selfId = `${targetId}__xref_src`;
  node.setMetaData(`target`, targetId);

  if (parser.peekTokens(...BACKREF_TOKENS)) {
    node.setMetaData(`target`, selfId);
    parser.consumeMany(...BACKREF_TOKENS);
  }

  parser.consume(t.COMMA);

  if (parser.peekTokens(...LINKABLE_BACK)) {
    node.setMetaData(`isLinkableBack`, true);
    parser.consumeMany(...LINKABLE_BACK);
  } else {
    node.document().idChapterLocations[selfId] = parser.parsingChapterNum;
    node.children = parser.parseUntil(node, t.XREF_CLOSE);
  }
  parser.consume(t.XREF_CLOSE);
  return node;
};

export default entity;

const BACKREF_TOKENS: TokenSpec[] = [
  [t.UNDERSCORE, `__`],
  [t.TEXT, `xref`],
  [t.UNDERSCORE, `_`],
  [t.TEXT, `src`],
];

const LINKABLE_BACK: TokenSpec[] = [
  // the asciidoc source string `?LINKABLE-BACK` is a sentinal magic string
  // meaning "a link back to the xref source (in targets that support linking)"
  t.QUESTION_MARK,
  [t.TEXT, `LINKABLE-BACK`],
];
