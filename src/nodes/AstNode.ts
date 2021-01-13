import Context from '../Context';
import AbstractAstNode from './AbstractAstNode';
import { AstNode as AstNodeInterface, NodeType, Token } from '../types';

interface Config {
  value?: string;
  context?: Context;
  startToken?: Token;
  endToken?: Token;
  subType?: string;
  level?: number;
}

export default class AstNode extends AbstractAstNode implements AstNodeInterface {
  public children: AstNodeInterface[] = [];
  public value = ``;
  public meta: AstNodeInterface['meta'] = {};
  public context: Context | undefined;

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

  public get type(): NodeType {
    return this._type;
  }

  public get parent(): AstNodeInterface {
    return this._parent;
  }
}
