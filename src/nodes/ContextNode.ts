import { NODE as n, NodeType, AstChildNode } from '../types';
import Context from '../Context';
import ChildNode from './ChildNode';

export default abstract class ContextNode extends ChildNode {
  public constructor(nodeType: NodeType, parent: AstChildNode, public context?: Context) {
    super(nodeType, parent);
  }

  public toJSON(): Record<string, any> {
    return {
      context: this.context ?? null,
      ...super.toJSON(),
    };
  }
}
