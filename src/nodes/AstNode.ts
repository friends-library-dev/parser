import { AstNode as AstNodeInterface, NodeType, Token, Context } from '../types';
import AbstractAstNode from './AbstractAstNode';

interface Config {
  value?: string;
  context?: Context;
  startToken?: Token;
  endToken?: Token;
  subType?: string;
  level?: number;
}

export default class AstNode extends AbstractAstNode implements AstNodeInterface {
  public override children: AstNodeInterface[] = [];
  public override value = ``;
  public override meta: AstNodeInterface['meta'] = {};

  public constructor(
    private _type: NodeType,
    private _parent: AstNodeInterface,
    config: Config = {},
  ) {
    super();

    if (config.context) {
      this.context = config.context;
      this.startToken = config.context.startToken;
    }

    if (config.value) {
      this.value = config.value;
    }

    // `!this._startToken` allows config.context.startToken to trump config.startToken
    // giving a more ergonomic API for creating nodes with optional contexts
    if (config.startToken && !this._startToken) {
      this.startToken = config.startToken;
    }

    if (config.endToken) {
      this._endToken = config.endToken;
    }

    if (config.subType) {
      this.meta.subType = config.subType;
    }

    if (config.level) {
      this.meta.level = config.level;
    }
  }

  public override get type(): NodeType {
    return this._type;
  }

  public override set type(type: NodeType) {
    this._type = type;
  }

  public override get parent(): AstNodeInterface {
    return this._parent;
  }

  public override set parent(parent: AstNodeInterface) {
    this._parent = parent;
  }
}
