import { NODE as n, NodeType } from '../types';
import AbstractChildNode from './AbstractChildNode';

export default class ChapterNode extends AbstractChildNode {
  public get type(): NodeType {
    return n.CHAPTER;
  }
}
