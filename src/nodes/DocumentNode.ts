import { AstNode, AstChildNode, NODE as n, NodeType } from '../types';
import AbstractNode from './AbstractNode';
import BlockNode from './BlockNode';

export default class DocumentNode extends AbstractNode implements AstNode {
  public epigraphs: AstChildNode[] = [];

  public get type(): NodeType {
    return n.DOCUMENT;
  }
}
