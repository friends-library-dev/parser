import Context from '../Context';
import { AstNode, AstNode as AstNodeInterface, Token, NodeType } from '../types';

export default abstract class AbstractAstNode implements AstNodeInterface {
  public children: AstNode[] = [];
  public value = ``;
  public meta: AstNodeInterface['meta'] = {};
  public context: Context | undefined;
  protected _startToken: Token | undefined;
  protected _endToken: Token | undefined;

  public get parent(): AstNodeInterface {
    throw new Error(`AbstractAstNode.parent not implemented`);
  }

  public get type(): NodeType {
    throw new Error(`AbstractAstNode.type not implemented`);
  }

  public set startToken(token: Token) {
    this._startToken = token;
  }

  public set endToken(token: Token) {
    this._endToken = token;
  }

  public get startToken(): Token {
    if (!this._startToken) {
      throw new Error(`Unexpected missing AstNode.startToken`);
    }
    return this._startToken;
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

  public print(withTokens?: true) {
    console.log(JSON.stringify(this.toJSON(withTokens), null, 2));
  }
}
