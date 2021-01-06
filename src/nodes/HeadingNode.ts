import { NODE as n, AstChildNode } from '../types';
import ChildNode from './ChildNode';

export default class HeadingNode extends ChildNode {
  public constructor(public parent: AstChildNode, public level: number) {
    super(n.HEADING, parent);
  }

  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      level: this.level,
    };
  }
}
