import { NODE as n, AstChildNode, TOKEN as t } from '../types';
import ChildNode from './ChildNode';

type SymbolType =
  | typeof t.DOUBLE_DASH
  | typeof t.LEFT_SINGLE_CURLY
  | typeof t.RIGHT_SINGLE_CURLY
  | typeof t.RIGHT_DOUBLE_CURLY
  | typeof t.LEFT_DOUBLE_CURLY;

export default class SymbolNode extends ChildNode {
  public constructor(
    public parent: AstChildNode,
    public symbolType: SymbolType,
    public value: string,
  ) {
    super(n.SYMBOL, parent);
  }

  public toJSON(): Record<string, any> {
    return {
      type: this.type,
      symbolType: this.symbolType,
      value: this.value,
    };
  }
}
