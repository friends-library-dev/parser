import { AstNode, NODE as n } from '../types';
import ChildNode from './ChildNode';

export default class ParagraphNode extends ChildNode {
  public constructor(public parent: AstNode) {
    super(n.PARAGRAPH, parent);
  }
}
