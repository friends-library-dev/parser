import { Parselet, Token, TOKEN as t } from '../types';
import textParselet from './textParselet';
import emphasisParselet from './emphasisParselet';
import strongParselet from './strongParselet';
import symbolParselet from './symbolParselet';

export default function getParselet(token: Token): Parselet | null {
  switch (token.type) {
    case t.TEXT:
      return textParselet;
    case t.WHITESPACE:
      return textParselet;
    case t.DOUBLE_ASTERISK:
      return strongParselet;
    case t.DOUBLE_DASH:
    case t.LEFT_SINGLE_CURLY:
    case t.RIGHT_SINGLE_CURLY:
    case t.LEFT_DOUBLE_CURLY:
    case t.RIGHT_DOUBLE_CURLY:
      return symbolParselet;
    case t.UNDERSCORE:
      if (token.literal === `_`) {
        return emphasisParselet;
      }
  }
  return null;
}
