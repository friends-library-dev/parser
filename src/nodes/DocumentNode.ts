import {
  AstNode,
  NodeType,
  DocumentNode as DocumentNodeInterface,
  NODE as n,
} from '../types';
import AbstractAstNode from './AbstractAstNode';

export default class DocumentNode
  extends AbstractAstNode
  implements AstNode, DocumentNodeInterface {
  public epigraphs: AstNode[] = [];
  public footnotes: AstNode[] = [];

  public get type(): NodeType {
    return n.DOCUMENT;
  }

  public isDocument(): this is DocumentNodeInterface {
    return true;
  }

  public document(): DocumentNodeInterface {
    return this;
  }

  public toJSON(withTokens?: true): Record<string, unknown> {
    return {
      epigraphs: this.epigraphs.map((epigraph) => epigraph.toJSON(withTokens)),
      ...super.toJSON(withTokens),
    };
  }
}
