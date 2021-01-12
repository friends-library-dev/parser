import { AstNode, NODE as n } from '../types';
import Context from '../Context';
import ContextNode from './ContextNode';

type BlockType = 'paragraph' | 'open' | 'quote' | 'example' | 'verse';

export default class BlockNode extends ContextNode {
  public blockType: BlockType = `paragraph`;

  public constructor(parent: AstNode, context?: Context) {
    super(n.BLOCK, parent, context);
    if (context?.type === `quote` || context?.type === `epigraph`) {
      this.blockType = `quote`;
    } else if (context?.type === `verse`) {
      this.blockType = `verse`;
    }
  }

  public toJSON(): Record<string, any> {
    return {
      blockType: this.blockType,
      ...super.toJSON(),
    };
  }
}
