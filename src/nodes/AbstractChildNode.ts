import { AstChildNode, AstNode } from '../types';
import AbstractNode from './AbstractNode';

export default abstract class ChildNode extends AbstractNode implements AstChildNode {
  public constructor(public parent: AstNode) {
    super();
  }
}
