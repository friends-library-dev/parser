import { AstNode, Camelcase, Visitor } from './types';

export default function traverse<Output = unknown, Context = unknown>(
  node: AstNode,
  visitor: Visitor<Output, Context>,
  output: Output,
  context: Context,
): void {
  const methods = visitor[camelCase(node.type)];

  if (methods?.enter) {
    methods.enter({ node, output, context });
  } else if (visitor?.node?.enter) {
    visitor.node.enter({ node, output, context });
  }

  for (const childNode of node.children) {
    traverse(childNode, visitor, output, context);
  }

  if (methods?.exit) {
    methods.exit({ node, output, context });
  } else if (visitor?.node?.exit) {
    visitor.node.exit({ node, output, context });
  }
}

function camelCase<T extends string>(input: T): Camelcase<T> {
  return input
    .toLowerCase()
    .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()) as Camelcase<T>;
}
