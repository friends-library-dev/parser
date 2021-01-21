import traverse from './traverse';
import Lexer from './Lexer';
import Parser from './Parser';
import { AstNode, Visitor, Visitable } from './types';

class DocumentVisitor implements Visitable<string[]> {
  public enter({ output }: { node: AstNode; output: string[] }): void {
    output.push(`<html class="concrete-impl">\n<body>`);
  }
  public exit({ output }: { node: AstNode; output: string[] }): void {
    output.push(`</body>\n</html>`);
  }
}

const simpleVisitor: Visitor<string[]> = {
  strong: {
    enter: ({ output }) => output.push(`<b>`),
    exit: ({ output }) => output.push(`</b>`),
  },

  document: new DocumentVisitor(),
  text: {
    enter: ({ node, output }) => output.push(node.value),
    exit: () => {},
  },
  paragraph: {
    enter: ({ output }) => output.push(`<p>`),
    exit: ({ output }) => output.push(`</p>`),
  },
  emphasis: {
    enter: ({ output }) => output.push(`<em>`),
    exit: ({ output }) => output.push(`</em>`),
  },
  heading: {
    enter: ({ node, output }) => output.push(`<h${node.meta?.level || `1`}>`),
    exit: ({ node, output }) => output.push(`</h${node.meta?.level || `1`}>`),
  },
  node: {
    enter: ({ node, output }) => output.push(`<div class="${node.type.toLowerCase()}">`),
    exit: ({ output }) => output.push(`</div>`),
  },
};

function visit(adoc: string): void {
  const lexer = new Lexer({ adoc });
  const parser = new Parser(lexer);
  const document = parser.parse();
  // document.print();
  const output: string[] = [];
  traverse(document, simpleVisitor, output, {});
  console.log(output.join(`\n`));
}

const test1 =
  `
== Chapter 1

Hello _world **foobar**._

`.trim() + `\n`;

visit(test1);
// console.log(test1);
