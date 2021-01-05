import { AstNode, NODE as n, NodeType } from '../types';
import AbstractNode from './AbstractNode';

export default class DocumentNode extends AbstractNode implements AstNode {
  public get type(): NodeType {
    return n.DOCUMENT;
  }
}
