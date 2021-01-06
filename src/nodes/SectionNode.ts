import { NODE as n, SectionNode as SectionNodeInterface } from '../types';
import DocumentNode from './DocumentNode';
import ChildNode from './ChildNode';

export default class SectionNode extends ChildNode implements SectionNodeInterface {
  public constructor(public parent: DocumentNode, public level: number) {
    super(n.CHAPTER, parent);
  }
}
