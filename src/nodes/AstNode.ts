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

    this.context = config.context;

    if (config.value) {
      this.value = config.value;
    }

    if (config.endToken) {
      this._endToken = config.endToken;
    }

    if (config.startToken) {
      this._startToken = config.startToken;
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
