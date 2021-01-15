import { Parselet, Token, TOKEN as t } from '../types';
import textParselet from './textParselet';
import underscoreParselet from './underscoreParselet';
import strongParselet from './strongParselet';
import symbolParselet from './symbolParselet';
import leftBracketParselet from './leftBracketParselet';
import inlinePassthroughParselet from './inlinePassthroughParselet';
import footnoteParselet from './footnoteParselet';

export default function getParselet(token: Token): Parselet | null {
  switch (token.type) {
    case t.COMMA:
    case t.TEXT:
    case t.EOL:
    case t.DOT:
    case t.WHITESPACE:
    case t.LEFT_PARENS:
    case t.RIGHT_BRACKET:
    case t.RIGHT_PARENS:
      return textParselet;
    case t.DOUBLE_ASTERISK:
      return strongParselet;
    case t.CARET:
    case t.FOOTNOTE_PREFIX:
      return footnoteParselet;
    case t.DOUBLE_DASH:
    case t.LEFT_SINGLE_CURLY:
    case t.RIGHT_SINGLE_CURLY:
    case t.LEFT_DOUBLE_CURLY:
    case t.RIGHT_DOUBLE_CURLY:
    case t.DEGREE_SYMBOL:
    case t.POUND_SYMBOL:
      return symbolParselet;
    case t.LEFT_BRACKET:
      return leftBracketParselet;
    case t.TRIPLE_PLUS:
      return inlinePassthroughParselet;
    case t.UNDERSCORE:
      return underscoreParselet;
  }
  return null;
}
