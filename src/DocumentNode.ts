import { AstNode, NodeType, NODE as n } from './types';
import AbstractAstNode from './AbstractAstNode';

export default class DocumentNode extends AbstractAstNode implements AstNode {
  public epigraphs: AstNode[] = [];

  public get type(): NodeType {
    return n.DOCUMENT;
  }
}
