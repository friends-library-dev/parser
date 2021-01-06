import { Parselet, Token, TOKEN as t } from '../types';
import textParselet from './textParselet';
import emphasisParselet from './emphasisParselet';

export default function getParselet(token: Token): Parselet | null {
  switch (token.type) {
    case t.TEXT:
      return textParselet;
    case t.WHITESPACE:
      return textParselet;
    case t.UNDERSCORE:
      if (token.literal === `_`) {
        return emphasisParselet;
      }
  }
  return null;
}
