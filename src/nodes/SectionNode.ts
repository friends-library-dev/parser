import { NODE as n, AstNode, SectionNode as SectionNodeInterface } from '../types';
import ChildNode from './ChildNode';

export default class SectionNode extends ChildNode implements SectionNodeInterface {
  public constructor(public parent: AstNode, public level: number) {
    super(n.CHAPTER, parent);
  }
}
