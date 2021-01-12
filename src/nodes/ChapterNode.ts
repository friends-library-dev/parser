import { NODE as n, SectionNode } from '../types';
import DocumentNode from './DocumentNode';
import ContextNode from './ContextNode';
import Context from '../Context';

export default class ChapterNode extends ContextNode implements SectionNode {
  public level = 2;

  public constructor(public parent: DocumentNode, context?: Context) {
    super(n.CHAPTER, parent, context);
  }
}
