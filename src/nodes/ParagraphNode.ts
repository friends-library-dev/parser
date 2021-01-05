import { NodeType, NODE as n, AstChildNode } from '../types';
import AbstractChildNode from './AbstractChildNode';

export default class ParagraphNode extends AbstractChildNode {
  public get type(): NodeType {
    return n.PARAGRAPH;
  }
}
