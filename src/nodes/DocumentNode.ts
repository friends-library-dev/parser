import { AstNode, NodeType, NODE as n } from '../types';
import AbstractAstNode from './AbstractAstNode';

export default class DocumentNode extends AbstractAstNode implements AstNode {
  public epigraphs: AstNode[] = [];

  public get type(): NodeType {
    return n.DOCUMENT;
  }

  public toJSON(withTokens?: true): Record<string, unknown> {
    return {
      epigraphs: this.epigraphs.map((epigraph) => epigraph.toJSON(withTokens)),
      ...super.toJSON(withTokens),
    };
  }
}
