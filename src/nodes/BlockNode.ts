import { AstChildNode, NODE as n } from '../types';
import Context from '../Context';
import ContextNode from './ContextNode';

type BlockType = 'paragraph' | 'open' | 'quote' | 'example';

export default class BlockNode extends ContextNode {
  public blockType: BlockType = `paragraph`;

  public constructor(parent: AstChildNode, context?: Context) {
    super(n.BLOCK, parent, context);
    if (context?.type === `quote`) {
      this.blockType = `quote`;
    }
  }

  public toJSON(): Record<string, any> {
    return {
      blockType: this.blockType,
      ...super.toJSON(),
    };
  }
}
