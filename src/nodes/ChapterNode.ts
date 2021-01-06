import { NODE as n, SectionNode } from '../types';
import DocumentNode from './DocumentNode';
import ChildNode from './ChildNode';

export default class ChapterNode extends ChildNode implements SectionNode {
  public level = 2;

  public constructor(public parent: DocumentNode) {
    super(n.CHAPTER, parent);
  }
}
