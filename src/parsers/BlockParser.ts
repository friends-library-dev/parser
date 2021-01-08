import { AstChildNode, TOKEN as t, TokenSpec, TokenType } from '../types';
import Parser from '../Parser';
import BlockNode from '../nodes/BlockNode';
import ParagraphNode from '../nodes/ParagraphNode';

export default class BlockParser {
  public constructor(private p: Parser) {}

  public parse(parent: AstChildNode): BlockNode {
    const context = this.p.parseContext();
    const block = new BlockNode(parent, context);

    this.prepareCompoundBlock(block);

    if (block.blockType === `paragraph`) {
      this.parseChild(block);
      this.consumeTrailingWhitespace();
      return block;
    }

    const guard = this.p.makeWhileGuard(`BlockParser.parse()`);
    while (guard() && !this.p.peekTokensAnyOf([t.EOL, t.EOF], [t.EOD])) {
      if (this.peekStartInnerBlock()) {
        block.children.push(this.parse(block));
      } else {
        this.parseChild(block);
        if (this.p.peekTokens(t.DOUBLE_EOL)) {
          this.p.consume(t.DOUBLE_EOL);
        }
      }
    }

    return block;
  }

  /* @TODO, should handle asterisms, other cool stuff */
  private parseChild(block: BlockNode): void {
    const child = new ParagraphNode(block, this.p.parseContext());
    block.children.push(child);
    child.children = this.p.parseUntilAnyOf(child, [t.DOUBLE_EOL], [t.EOL, t.EOF]);
  }

  private consumeTrailingWhitespace(): void {
    if (this.p.currentIs(t.DOUBLE_EOL)) {
      this.p.consume(t.DOUBLE_EOL);
    } else if (this.p.peekTokens(t.EOL, t.EOF)) {
      this.p.consumeMany(t.EOL, t.EOF);
    }
  }

  private prepareCompoundBlock(block: BlockNode): void {
    if (block.blockType === `quote`) {
      this.p.consumeMany(QUOTE, t.EOL);
      this.p = this.p.getBufferedParser(t.EOL, QUOTE, t.EOX);
    } else if (this.p.peekTokens(t.DOUBLE_DASH, t.DOUBLE_EOL)) {
      block.blockType = `open`;
      this.p.consumeMany(t.DOUBLE_DASH, t.DOUBLE_EOL);
      this.p = this.p.getBufferedParser(t.DOUBLE_EOL, t.DOUBLE_DASH, t.EOX);
    } else if (this.p.peekTokensAnyOf([EXAMPLE, t.DOUBLE_EOL])) {
      block.blockType = `example`;
      this.p.consumeMany(EXAMPLE, t.DOUBLE_EOL);
      this.p = this.p.getBufferedParser(t.DOUBLE_EOL, EXAMPLE, t.EOX);
    }
  }

  private peekStartInnerBlock(): boolean {
    const [token1, token2] = this.p.firstTokensAfterOptionalContext();
    if (this.p.tokenIs(token1, EXAMPLE) && this.p.tokenIs(token2, t.EOX)) {
      return true;
    }
    return false;
  }
}

const EXAMPLE: TokenSpec = [t.EQUALS, `====`];
const QUOTE: TokenSpec = [t.UNDERSCORE, `____`];
