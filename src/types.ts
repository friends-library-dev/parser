import Parser from './Parser';

export const TOKEN = {
  TEXT: `TEXT`,
  ASTERISK: `ASTERISK`,
  DOUBLE_ASTERISK: `DOUBLE_ASTERISK`,
  TRIPLE_ASTERISK: `TRIPLE_ASTERISK`,
  THEMATIC_BREAK: `THEMATIC_BREAK`,
  STRAIGHT_DOUBLE_QUOTE: `STRAIGHT_DOUBLE_QUOTE`,
  STRAIGHT_SINGLE_QUOTE: `STRAIGHT_SINGLE_QUOTE`,
  DOUBLE_COLON: `DOUBLE_COLON`,
  FORWARD_SLASH: `FORWARD_SLASH`,
  PIPE: `PIPE`,
  PLUS: `PLUS`,
  HASH: `HASH`,
  COMMENT: `COMMENT`,
  TRIPLE_PLUS: `TRIPLE_PLUS`,
  WHITESPACE: `WHITESPACE`,
  DOUBLE_DASH: `DOUBLE_DASH`,
  UNDERSCORE: `UNDERSCORE`,
  LEFT_SINGLE_CURLY: `LEFT_SINGLE_CURLY`,
  RIGHT_SINGLE_CURLY: `RIGHT_SINGLE_CURLY`,
  LEFT_DOUBLE_CURLY: `LEFT_DOUBLE_CURLY`,
  RIGHT_DOUBLE_CURLY: `RIGHT_DOUBLE_CURLY`,
  LEFT_BRACKET: `LEFT_BRACKET`,
  RIGHT_BRACKET: `RIGHT_BRACKET`,
  LEFT_PARENS: `LEFT_PARENS`,
  RIGHT_PARENS: `RIGHT_PARENS`,
  FOOTNOTE_PREFIX: `FOOTNOTE_PREFIX`,
  FOOTNOTE_STANZA: `FOOTNOTE_STANZA`,
  FOOTNOTE_PARAGRAPH_SPLIT: `FOOTNOTE_PARAGRAPH_SPLIT`,
  DEGREE_SYMBOL: `DEGREE_SYMBOL`,
  POUND_SYMBOL: `POUND_SYMBOL`,
  DOLLAR_SYMBOL: `DOLLAR_SYMBOL`,
  ENTITY: `ENTITY`,
  AMPERSAND: `AMPERSAND`,
  EQUALS: `EQUALS`,
  COMMA: `COMMA`,
  CARET: `CARET`,
  BACKTICK: `BACKTICK`,
  DOT: `DOT`,
  EOL: `EOL`,
  DOUBLE_EOL: `DOUBLE_EOL`,
  EOF: `EOF`,
  EOD: `EOD`, // end of (possibly multi-file) document
  ILLEGAL: `ILLEGAL`,
  EOX: `EOX`, // special matcher token: `EOX` -- not technically a token type
} as const;

export type TokenType = Exclude<keyof typeof TOKEN, 'EOX'>;
export type TokenTypeMatcher = TokenType | `EOX`;
export type TokenSpec = TokenTypeMatcher | [type: TokenTypeMatcher, literal: string];

export type Token = {
  type: TokenType;
  literal: string;
  filename?: string;
  line: number;
  column: {
    start: number;
    end: number;
  };
};

export interface Line {
  content: string;
  number: number;
  charIdx: number;
  filename?: string;
}

export interface Lexer {
  tokens(): Token[];
  nextToken(): Token;
}

export interface LexerInput {
  adoc: string;
  filename?: string;
}

export const NODE = {
  DOCUMENT: `DOCUMENT`,
  CHAPTER: `CHAPTER`,
  HEADING: `HEADING`,
  SECTION: `SECTION`,
  PARAGRAPH: `PARAGRAPH`,
  EMPHASIS: `EMPHASIS`,
  STRONG: `STRONG`,
  TEXT: `TEXT`,
  BLOCK: `BLOCK`,
  THEMATIC_BREAK: `THEMATIC_BREAK`,
  VERSE_STANZA: `VERSE_STANZA`,
  VERSE_LINE: `VERSE_LINE`,
  SYMBOL: `SYMBOL`,
  INLINE_PASSTHROUGH: `INLINE_PASSTHROUGH`,
} as const;

export type NodeType = keyof typeof NODE;

export interface AstNode {
  type: NodeType;
  value: string;
  children: AstChildNode[];
  position: AstPosition;
  toJSON: () => Record<string, any>;
  log: () => void;
}

export type AstChildNode = AstNode & {
  parent: AstNode;
};

export interface SectionNode {
  level: number;
}

export interface AstPosition {
  start: {
    line: number;
    column: number;
    filename?: string;
  };
  end: {
    line: number;
    column: number;
    filename?: string;
  };
}

export interface Parselet {
  (parser: Parser, parent: AstChildNode): AstChildNode;
}
