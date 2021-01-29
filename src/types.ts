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
  TRIPLE_PLUS: `TRIPLE_PLUS`,
  QUADRUPLE_PLUS: `QUADRUPLE_PLUS`,
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
  RAW_PASSTHROUGH: `RAW_PASSTHROUGH`,
  DOT: `DOT`,
  SEMICOLON: `SEMICOLON`,
  COLON: `COLON`,
  EXCLAMATION_MARK: `EXCLAMATION_MARK`,
  QUESTION_MARK: `QUESTION_MARK`,
  ILLEGAL: `ILLEGAL`,
  EOL: `EOL`,
  DOUBLE_EOL: `DOUBLE_EOL`,
  EOF: `EOF`,
  EOD: `EOD`, // end of (possibly multi-file) document
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

export interface Lexer {
  tokens(): Token[];
  nextToken(): Token;
}

export const NODE = {
  DOCUMENT: `DOCUMENT`,
  CHAPTER: `CHAPTER`,
  HEADING: `HEADING`,
  HEADING_SEQUENCE_IDENTIFIER: `HEADING_SEQUENCE_IDENTIFIER`,
  HEADING_TITLE: `HEADING_TITLE`,
  HEADING_SEGMENT: `HEADING_SEGMENT`,
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
  BLOCK_PASSTHROUGH: `BLOCK_PASSTHROUGH`,
  UNORDERED_LIST: `UNORDERED_LIST`,
  LIST_ITEM: `LIST_ITEM`,
  INLINE: `INLINE`,
  FOOTNOTE: `FOOTNOTE`,
  REDACTED: `REDACTED`,
  DESCRIPTION_LIST: `DESCRIPTION_LIST`,
  DESCRIPTION_LIST_ITEM: `DESCRIPTION_LIST_ITEM`,
  DESCRIPTION_LIST_ITEM_TERM: `DESCRIPTION_LIST_ITEM_TERM`,
  DESCRIPTION_LIST_ITEM_CONTENT: `DESCRIPTION_LIST_ITEM_CONTENT`,
  DISCOURSE_PART_IDENTIFIER: `DISCOURSE_PART_IDENTIFIER`,
  ENTITY: `ENTITY`,
  MONEY: `MONEY`,
} as const;

export type NodeType = keyof typeof NODE;

export const ENTITY = {
  EMDASH: `EMDASH`,
  ELLIPSES: `ELLIPSES`,
  AMPERSAND: `AMPERSAND`,
} as const;

export type EntityType = keyof typeof ENTITY;

export interface Context {
  classList: string[];
  type?: 'quote' | 'verse' | 'epigraph' | 'discrete';
  id?: string;
  quoteAttribution?: Token[];
  quoteSource?: Token[];
  shortTitle?: Token[];
  startToken: Token;
  endToken: Token;
  toJSON: (withTokens?: true) => Record<string, unknown>;
  print: (withTokens?: true) => void;
}

export interface AstNode {
  type: NodeType;
  value: string;
  children: AstNode[];
  context?: Context;
  startToken: Token;
  endToken: Token;
  parent: AstNode;
  toJSON: (withTokens?: true) => Record<string, unknown>;
  print: (withTokens?: true) => void;
  isDocument: () => this is DocumentNode;
  document: () => DocumentNode;
  isAttributedQuoteBlock(): boolean;
  isQuoteBlock(): boolean;
  isOpenBlock(): boolean;
  isExampleBlock(): boolean;
  isNumberedBlock(): boolean;
  isPoetryBlock(): boolean;
  isFirstChild(): boolean;
  isLastChild(): boolean;
  isOnlyChild(): boolean;
  isParagraph(): boolean;
  hasSiblings(): boolean;
  isInFootnote(): boolean;
  descendsFrom(type: NodeType): boolean;
  siblingIndex(): number;
  nextSibling(): AstNode | null;
  hasClass(className: string): boolean;
  setMetaData(key: string, value: string | number | boolean): void;
  getMetaData(key: string): string | number | boolean | undefined;
  meta: {
    subType?: string;
    level?: number;
    data?: {
      [k: string]: string | number | boolean;
    };
  };
}

export type DocumentNode = AstNode & {
  epigraphs: AstNode[];
  footnotes: AstNode[];
};

export interface Parselet {
  (parser: Parser, parent: AstNode): AstNode;
}

export interface VisitData<Output = unknown, Context = unknown> {
  node: AstNode;
  output: Output;
  context: Context;
  index: number;
}

export interface VisitFn<Output = unknown, Context = unknown, ReturnType = unknown> {
  (data: VisitData<Output, Context>): ReturnType;
}

export interface Visitable<Output = unknown, Context = unknown> {
  enter?: VisitFn<Output, Context>;
  exit?: VisitFn<Output, Context>;
  dispatch?: (node: AstNode) => Visitable<Output, Context>;
}

type ToCamel<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Head}${Capitalize<ToCamel<Tail>>}`
  : S;

export type Camelcase<T extends string> = ToCamel<Lowercase<T>>;

type ContextualNode = `${NodeType}_IN_${NodeType}`;

export type Visitor<Output = unknown, Context = unknown> = {
  [N in NodeType | ContextualNode | 'node' as `${Camelcase<string & N>}`]?: Visitable<
    Output,
    Context
  >;
};

export interface AsciidocFile {
  adoc: string;
  filename?: string;
}
