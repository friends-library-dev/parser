import { NODE as n, AstChildNode } from '../types';
import ChildNode from './ChildNode';

export default class TextNode extends ChildNode {
  public constructor(public parent: AstChildNode, public value: string) {
    super(n.TEXT, parent);
  }

  public toJSON(): Record<string, any> {
    return {
      type: this.type,
      value: this.value,
    };
  }
}
