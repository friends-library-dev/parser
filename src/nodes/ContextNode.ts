import { NodeType, AstNode } from '../types';
import Context from '../Context';
import ChildNode from './ChildNode';

export default class ContextNode extends ChildNode {
  public constructor(nodeType: NodeType, parent: AstNode, public context?: Context) {
    super(nodeType, parent);
  }

  public toJSON(): Record<string, any> {
    return {
      context: this.context ?? null,
      ...super.toJSON(),
    };
  }
}
