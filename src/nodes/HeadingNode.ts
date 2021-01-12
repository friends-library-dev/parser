import Context from '../Context';
import { NODE as n, AstChildNode } from '../types';
import ContextNode from './ContextNode';

export default class HeadingNode extends ContextNode {
  public constructor(
    public parent: AstChildNode,
    public level: number,
    context?: Context,
  ) {
    super(n.HEADING, parent, context);
  }

  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      level: this.level,
    };
  }
}
