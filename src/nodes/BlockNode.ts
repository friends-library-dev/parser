import { NODE as n } from '../types';
import ChildNode from './ChildNode';
import ChapterNode from './ChapterNode';

export default class BlockNode extends ChildNode {
  public constructor(public parent: ChapterNode) {
    super(n.BLOCK, parent);
  }
}
