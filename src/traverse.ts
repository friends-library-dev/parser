import { AstNode, Visitable, Camelcase, Visitor, NodeType, NODE as n } from './types';

export default function traverse<Output = unknown, Context = unknown>(
  node: AstNode,
  visitor: Visitor<Output, Context>,
  output: Output,
  context: Context,
  index = 0,
): void {
  let methods: Visitable<Output, Context> | undefined;
  for (const type of getTypes(node)) {
    methods = methods ?? visitor[type];
  }

  if (methods?.dispatch) {
    methods = methods.dispatch(node);
  }

  const data = { node, output, context, index };
  methods?.enter ? methods.enter(data) : visitor.node?.enter?.(data);

  for (let i = 0; i < node.children.length; i++) {
    traverse(node.children[i] as AstNode, visitor, output, context, i);
  }

  methods?.exit ? methods.exit(data) : visitor.node?.exit?.(data);
}

function getTypes(
  node: AstNode,
): Array<Camelcase<NodeType | `${NodeType}_IN_${NodeType}`>> {
  if (node.type === n.CHAPTER || node.isDocument()) {
    return [camelCase(node.type)];
  }

  let types: ReturnType<typeof getTypes> = [];
  let current = node.parent;
  while (current.type !== n.CHAPTER) {
    types.push(camelCase(`${node.type}_IN_${current.type}` as const));
    current = current.parent;
  }

  types.push(camelCase(node.type));
  return types;
}

function camelCase<T extends string>(input: T): Camelcase<T> {
  return input
    .toLowerCase()
    .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()) as Camelcase<T>;
}
