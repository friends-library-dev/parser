import { NODE as n, AstNode } from '../types';
import ChildNode from './ChildNode';

export default class ChapterNode extends ChildNode {
  public constructor(public parent: AstNode) {
    super(n.CHAPTER, parent);
  }
}
