import stripIndent from 'strip-indent';
import { Token } from '../types';
import Lexer from '../lexer';
import ChapterNode from '../nodes/ChapterNode';
import DocumentNode from '../nodes/DocumentNode';
import ParagraphNode from '../nodes/ParagraphNode';
import Parser from '../Parser';
import BlockNode from '../nodes/BlockNode';

export function parseAdocFile(adoc: string): DocumentNode {
  const parser = getParser(prepareAdocFile(adoc));
  return parser.parse();
}

export function prepareAdocFile(adoc: string): string {
  return stripIndent(adoc).trim() + `\n`;
}

export function getParser(adoc: string): Parser {
  const lexer = new Lexer({ adoc });
  return new Parser(lexer);
}

export function getPara(): ParagraphNode {
  return new ParagraphNode(getChapter());
}

export function getChapter(): ChapterNode {
  return new ChapterNode(getDoc());
}

export function getDoc(): DocumentNode {
  return new DocumentNode();
}

export function getBlock(): BlockNode {
  return new BlockNode(getChapter());
}

export function simplifyToken(token: Token): Pick<Token, 'type' | 'literal'> {
  return {
    type: token.type,
    literal: token.literal,
  };
}
