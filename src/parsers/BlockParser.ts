import { AstChildNode, AstNode, TOKEN as t, TokenSpec, NODE as n } from '../types';
import Parser from '../Parser';
import PoetryParser from './PoetryParser';
import BlockNode from '../nodes/BlockNode';
import ParagraphNode from '../nodes/ParagraphNode';
import Context from '../Context';
import ContextNode from '../nodes/ContextNode';

export default class BlockParser {
  public constructor(private p: Parser) {}

  public parse(parent: AstNode): AstChildNode {
    const context = this.p.parseContext();
    const thematicBreak = this.parseThematicBreak(parent, context);
    if (thematicBreak) {
      return thematicBreak;
    }

    const block = new BlockNode(parent, context);

    this.prepareCompoundBlock(block);

    if (block.blockType === `paragraph`) {
      this.parseChild(block);
      this.consumeTrailingWhitespace();
      return block;
    }

    const guard = this.p.makeWhileGuard(`BlockParser.parse()`);
    while (guard() && !this.p.peekTokensAnyOf([t.EOL, t.EOF], [t.EOF, t.EOD], [t.EOD])) {
      if (block.blockType === `verse`) {
        const poetryParser = new PoetryParser(this.p);
        block.children = poetryParser.parse(block);
      } else if (this.peekStartInnerBlock()) {
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

  private parseThematicBreak(
    parent: AstNode,
    context?: Context,
  ): AstChildNode | undefined {
    if (
      this.p.peekTokensAnyOf(
        [t.THEMATIC_BREAK, t.EOL, t.EOX],
        [t.THEMATIC_BREAK, t.DOUBLE_EOL],
      )
    ) {
      if (!context) {
        this.p.error(`thematic break missing context`);
      }
      this.p.consume(t.THEMATIC_BREAK);
      if (this.p.currentIs(t.DOUBLE_EOL)) {
        this.p.consume(t.DOUBLE_EOL);
      } else {
        this.p.consumeMany(t.EOL, t.EOX);
      }
      return new ContextNode(n.THEMATIC_BREAK, parent, context);
    }
    return undefined;
  }

  private parseChild(block: BlockNode): void {
    const context = this.p.parseContext();
    const thematicBreak = this.parseThematicBreak(block, context);
    if (thematicBreak) {
      block.children.push(thematicBreak);
      return;
    }
    const para = new ParagraphNode(block, context);
    block.children.push(para);
    para.children = this.p.parseUntilAnyOf(para, [t.DOUBLE_EOL], [t.EOL, t.EOF]);
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
      this.p.consumeMany(QUAD_UNDERSCORE, t.EOL);
      this.p = this.p.getBufferedParser(t.EOL, QUAD_UNDERSCORE, t.EOX);
    } else if (block.blockType == `verse`) {
      this.p.consumeMany(QUAD_UNDERSCORE, t.EOL);
      this.p = this.p.getBufferedParser(QUAD_UNDERSCORE, t.EOX);
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
    } else if (this.p.tokenIs(token1, QUAD_UNDERSCORE) && this.p.tokenIs(token2, t.EOX)) {
      return true;
    }
    return false;
  }
}

const EXAMPLE: TokenSpec = [t.EQUALS, `====`];
const QUAD_UNDERSCORE: TokenSpec = [t.UNDERSCORE, `____`];
