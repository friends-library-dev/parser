import { NodeType, NODE as n, AstChildNode } from '../types';
import AbstractChildNode from './AbstractChildNode';

export default class HeadingNode extends AbstractChildNode {
  public constructor(public parent: AstChildNode, public level: number) {
    super(parent);
  }

  public get type(): NodeType {
    return n.HEADING;
  }

  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      level: this.level,
    };
  }
}
