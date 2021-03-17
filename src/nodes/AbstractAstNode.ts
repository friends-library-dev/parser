import {
  AstNode,
  AstNode as AstNodeInterface,
  DocumentNode,
  Token,
  NodeType,
  Context,
  NODE as n,
} from '../types';

export default abstract class AbstractAstNode implements AstNodeInterface {
  public children: AstNode[] = [];
  public value = ``;
  public meta: AstNodeInterface['meta'] = {};
  public context: Context | undefined;
  protected _startToken: Token | undefined;
  protected _endToken: Token | undefined;

  public get parent(): AstNodeInterface {
    throw new Error(`AbstractAstNode.parent not implemented for type: ${this.type}`);
  }

  public get chapter(): AstNodeInterface {
    let current: AstNodeInterface = this;
    while (current.type !== n.CHAPTER) {
      current = current.parent;
    }
    return current;
  }

  public document(): DocumentNode {
    let current: AstNodeInterface = this;
    while (!current.isDocument()) {
      current = current.parent;
    }
    return current;
  }

  public get type(): NodeType {
    throw new Error(`AbstractAstNode.type not implemented`);
  }

  public descendsFrom(type: NodeType): boolean {
    let current: AstNodeInterface = this;
    while (!current.isDocument()) {
      current = current.parent;
      if (current.type === type) {
        return true;
      }
    }
    return false;
  }

  public isDocument(): this is DocumentNode {
    return false;
  }

  public parentIsDocument(): boolean {
    return !this.isDocument() && this.parent.isDocument();
  }

  public isParagraph(): boolean {
    return this.type === n.PARAGRAPH;
  }

  public isOpenBlock(): boolean {
    return this.meta.subType === `open`;
  }

  public isNumberedBlock(): boolean {
    return this.isExampleBlock() && this.hasClass(`numbered-group`);
  }

  public isExampleBlock(): boolean {
    return this.meta.subType === `example`;
  }

  public isPoetryBlock(): boolean {
    return this.type === n.BLOCK && this.meta.subType === `verse`;
  }

  public isQuoteBlock(): boolean {
    return this.type === n.BLOCK && this.context?.type === `quote`;
  }

  public isAttributedQuoteBlock(): boolean {
    if (!this.isQuoteBlock()) {
      return false;
    }
    const context = this.context;
    return !!(context?.quoteSource?.length || context?.quoteSource?.length);
  }

  public hasClass(className: string): boolean {
    return this.context?.classList.includes(className) ?? false;
  }

  public siblingIndex(): number {
    return this.parent.children.indexOf(this);
  }

  public nextSibling(): AstNode | null {
    return this.parent.children[this.siblingIndex() + 1] ?? null;
  }

  public isFirstChild(): boolean {
    return this.siblingIndex() === 0;
  }

  public isLastChild(): boolean {
    return this.siblingIndex() === this.parent.children.length - 1;
  }

  public isOnlyChild(): boolean {
    return this.parent.children.length === 1;
  }

  public hasSiblings(): boolean {
    return !this.isOnlyChild();
  }

  public isInFootnote(): boolean {
    return this.descendsFrom(n.FOOTNOTE);
  }

  public expectFirstChild(type?: NodeType): AstNode {
    const firstChild = this.children[0];
    if (!firstChild) {
      throw new Error(`Unexpected missing first child`);
    }

    if (type && firstChild.type !== type) {
      throw new Error(
        `Unexpected wrong type for first child. Expected ${type}, got: ${firstChild.type}`,
      );
    }

    return firstChild;
  }

  public setMetaData(key: string, value: string | number | boolean): void {
    if (!this.meta.data) {
      this.meta.data = {};
    }
    this.meta.data[key] = value;
  }

  public getMetaData(key: string): string | number | boolean | undefined {
    return this.meta.data?.[key];
  }

  public expectBooleanMetaData(key: string): boolean {
    const data = this.getMetaData(key);
    if (data !== true && data !== false) {
      throw new Error(`Unexpected non-boolean metadata for key=${key}, val=${data}`);
    }
    return data;
  }

  public expectNumberMetaData(key: string): number {
    const data = this.getMetaData(key);
    if (typeof data !== `number`) {
      throw new Error(`Unexpected non-number metadata for key=${key}, val=${data}`);
    }
    return data;
  }

  public expectStringMetaData(key: string): string {
    const data = this.getMetaData(key);
    if (typeof data !== `string`) {
      throw new Error(`Unexpected non-string metadata for key=${key}, val=${data}`);
    }
    return data;
  }

  public set startToken(token: Token) {
    this._startToken = token;
  }

  public get startToken(): Token {
    if (!this._startToken) {
      throw new Error(`Unexpected missing AstNode.startToken`);
    }
    return this._startToken;
  }

  public set endToken(token: Token) {
    this._endToken = token;
  }

  public get endToken(): Token {
    if (!this._endToken) {
      throw new Error(`Unexpected missing AstNode.endToken`);
    }
    return this._endToken;
  }

  public toJSON(withTokens?: true): Record<string, unknown> {
    return {
      type: this.type,
      ...(this.context ? { context: this.context.toJSON() } : {}),
      ...(this.value ? { value: this.value } : {}),
      ...(this.children.length
        ? { children: this.children.map((c) => c.toJSON(withTokens)) }
        : {}),
      ...(Object.keys(this.meta).length ? { meta: this.meta } : {}),
      ...(withTokens ? { startToken: this.startToken, endToken: this.endToken } : {}),
    };
  }

  public print(withTokens?: true): void {
    console.log(JSON.stringify(this.toJSON(withTokens), null, 2));
  }
}
