import {
  AstNode,
  NodeType,
  DocumentNode as DocumentNodeInterface,
  NODE as n,
} from '../types';
import AbstractAstNode from './AbstractAstNode';
import Node from './AstNode';

export default class DocumentNode
  extends AbstractAstNode
  implements AstNode, DocumentNodeInterface
{
  public epigraphs: AstNode;
  public footnotes: AstNode;
  public idChapterLocations: Record<string, number> = {};
  public embeddableSections: Record<string, AstNode> = {};

  public constructor() {
    super();
    this.epigraphs = new Node(n.COLLECTION, this);
    this.footnotes = new Node(n.COLLECTION, this);
  }

  public override get type(): NodeType {
    return n.DOCUMENT;
  }

  public override get chapter(): AstNode {
    throw new Error(`Error: attempt to resolve chapter from document node`);
  }

  public override isDocument(): this is DocumentNodeInterface {
    return true;
  }

  public override parentIsDocument(): boolean {
    return false;
  }

  public override document(): DocumentNodeInterface {
    return this;
  }

  public get chapters(): AstNode[] {
    return this.children;
  }

  public override toJSON(withTokens?: true): Record<string, unknown> {
    return {
      footnotes: this.footnotes.children.map((footnote) => footnote.toJSON(withTokens)),
      epigraphs: this.epigraphs.children.map((epigraph) => epigraph.toJSON(withTokens)),
      ...(Object.keys(this.embeddableSections).length
        ? {
            embeddableSections: Object.keys(this.embeddableSections).reduce(
              (map, key) => ({
                ...map,
                [key]: `[[AstNode]]`,
              }),
              {} as Record<string, string>,
            ),
          }
        : {}),
      ...(Object.keys(this.idChapterLocations).length
        ? { idChapterLocations: this.idChapterLocations }
        : {}),
      ...super.toJSON(withTokens),
    };
  }
}
