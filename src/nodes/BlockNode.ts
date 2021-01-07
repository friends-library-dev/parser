import { NODE as n } from '../types';
import Context from '../Context';
import ChildNode from './ChildNode';
import ChapterNode from './ChapterNode';

export default class BlockNode extends ChildNode {
  public constructor(public parent: ChapterNode, public context: Context | null) {
    super(n.BLOCK, parent);
  }

  public toJSON(): Record<string, any> {
    return {
      context: this.context ?? null,
      ...super.toJSON(),
    };
  }
}
