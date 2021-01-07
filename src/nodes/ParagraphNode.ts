import { AstChildNode, NODE as n } from '../types';
import ContextNode from './ContextNode';
import Context from '../Context';

export default class ParagraphNode extends ContextNode {
  public constructor(parent: AstChildNode, context?: Context) {
    super(n.PARAGRAPH, parent, context);
  }
}
