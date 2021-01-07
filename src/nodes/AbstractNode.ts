import {
  AstNode as AstNodeInterface,
  AstChildNode,
  AstPosition,
  NodeType,
} from '../types';

export default abstract class AbstractNode implements AstNodeInterface {
  public children: AstChildNode[] = [];
  public position: AstPosition = {
    start: {
      line: -1,
      column: -1,
    },
    end: {
      line: -1,
      column: -1,
    },
  };

  public get type(): NodeType {
    throw new Error(`Not implemented`);
  }

  public toJSON(): Record<string, any> {
    return {
      type: this.type,
      children: this.children.map((child) => child.toJSON()),
    };
  }

  public log(): void {
    console.log(JSON.stringify(this, null, 2));
  }
}
