import { NodeType, NODE as n, AstChildNode } from '../types';
import AbstractChildNode from './AbstractChildNode';

export default class TextNode extends AbstractChildNode {
  public constructor(public parent: AstChildNode, public value: string) {
    super(parent);
  }

  public get type(): NodeType {
    return n.TEXT;
  }

  public toJSON(): Record<string, any> {
    return {
      type: this.type,
      value: this.value,
    };
  }
}
