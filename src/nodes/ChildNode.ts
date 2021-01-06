import { AstChildNode, AstNode, NodeType } from '../types';
import AbstractNode from './AbstractNode';

export default class ChildNode extends AbstractNode implements AstChildNode {
  public constructor(private _type: NodeType, public parent: AstNode) {
    super();
  }

  public get type(): NodeType {
    return this._type;
  }
}
