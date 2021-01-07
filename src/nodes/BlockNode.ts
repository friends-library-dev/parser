import { AstChildNode, NODE as n } from '../types';
import Context from '../Context';
import ContextNode from './ContextNode';
import ChapterNode from './ChapterNode';

export default class BlockNode extends ContextNode {
  public constructor(parent: AstChildNode, context?: Context) {
    super(n.BLOCK, parent, context);
  }
}
