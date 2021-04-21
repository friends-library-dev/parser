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
  implements AstNode, DocumentNodeInterface {
  public epigraphs: AstNode;
  public footnotes: AstNode;
  public idChapterLocations: Record<string, number> = {};
  public embeddableSections: Record<string, AstNode> = {};

  public constructor() {
    super();
    this.epigraphs = new Node(n.COLLECTION, this);
    this.footnotes = new Node(n.COLLECTION, this);
  }

  public get type(): NodeType {
    return n.DOCUMENT;
  }

  public get chapter(): AstNode {
    throw new Error(`Error: attempt to resolve chapter from document node`);
  }

  public isDocument(): this is DocumentNodeInterface {
    return true;
  }

  public parentIsDocument(): boolean {
    return false;
  }

  public document(): DocumentNodeInterface {
    return this;
  }

  public get chapters(): AstNode[] {
    return this.children;
  }

  public toJSON(withTokens?: true): Record<string, unknown> {
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
