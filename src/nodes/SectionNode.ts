import { NODE as n, AstNode, SectionNode as SectionNodeInterface } from '../types';
import ChildNode from './ChildNode';
import Context from '../Context';

export default class SectionNode extends ChildNode implements SectionNodeInterface {
  public constructor(
    public parent: AstNode,
    public level: number,
    public context?: Context,
  ) {
    super(n.SECTION, parent);
  }

  public toJSON(): Record<string, any> {
    return {
      level: this.level,
      ...super.toJSON(),
      context: this.context ? this.context : null,
    };
  }
}
