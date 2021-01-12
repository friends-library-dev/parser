import SymbolNode from '../nodes/SymbolNode';
import { Parselet, TOKEN as t, NODE as n } from '../types';

const symbol: Parselet = (parser, parent) => {
  const current = parser.current;
  const node = new SymbolNode(parent, current.type as any, current.literal);
  parser.consume();
  return node;
};

export default symbol;
