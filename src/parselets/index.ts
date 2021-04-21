import { Parselet, Token, TOKEN as t } from '../types';
import textParselet from './textParselet';
import underscoreParselet from './underscoreParselet';
import strongParselet from './strongParselet';
import symbolParselet from './symbolParselet';
import leftBracketParselet from './leftBracketParselet';
import inlinePassthroughParselet from './inlinePassthroughParselet';
import footnoteParselet from './footnoteParselet';
import entityParselet from './entityParselet';
import xrefParselet from './xrefParselet';
import { Parser } from '..';

export default function getParselet(token: Token, parser: Parser): Parselet | null {
  switch (token.type) {
    case t.COMMA:
    case t.TEXT:
    case t.EOL:
    case t.DOT:
    case t.QUESTION_MARK:
    case t.EXCLAMATION_MARK:
    case t.COLON:
    case t.SEMICOLON:
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
    case t.DOLLAR_SYMBOL:
      return symbolParselet;
    case t.LEFT_BRACKET:
      return leftBracketParselet;
    case t.TRIPLE_PLUS:
      if (token.column.start === 1 && parser.peek.literal === `[`) {
        return textParselet;
      }
      return inlinePassthroughParselet;
    case t.UNDERSCORE:
      return underscoreParselet;
    case t.ENTITY:
      return entityParselet;
    case t.XREF_OPEN:
      return xrefParselet;
  }
  return null;
}
