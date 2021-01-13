import { AstNode, TOKEN as t, TokenSpec, NODE as n } from '../types';
import Parser from '../Parser';
import PoetryParser from './PoetryParser';
import Context from '../Context';
import Node from '../nodes/AstNode';

export default class BlockParser {
  public constructor(private p: Parser) {}

  public parse(parent: AstNode): AstNode {
    const context = this.p.parseContext();
    const thematicBreak = this.parseThematicBreak(parent, context);
    if (thematicBreak) {
      return thematicBreak;
    }

    const unorderedList = this.parseUnorderedList(parent, context);
    if (unorderedList) {
      return unorderedList;
    }

    const block = this.makeBlock(parent, context);

    this.prepareCompoundBlock(block);

    if (block.meta?.subType === `paragraph`) {
      this.parseChild(block);
      this.consumeTrailingWhitespace();
      block.endToken = this.p.lastNonEOX();
      return block;
    }

    const guard = this.p.makeWhileGuard(`BlockParser.parse()`);
    while (guard() && !this.p.peekTokensAnyOf([t.EOL, t.EOF], [t.EOF, t.EOD], [t.EOD])) {
      if (block.meta?.subType === `verse`) {
        const poetryParser = new PoetryParser(this.p);
        block.children = poetryParser.parse(block);
      } else if (this.peekStartInnerBlock()) {
        block.children.push(this.parse(block));
      } else if (this.p.peekHeading() && block.meta?.subType === `open`) {
        block.children.push(this.p.parseHeading(block));
      } else {
        this.parseChild(block);
        if (this.p.peekTokens(t.DOUBLE_EOL)) {
          this.p.consume(t.DOUBLE_EOL);
        }
      }
    }

    block.endToken = this.p.lastNonEOX();
    return block;
  }

  private parseUnorderedList(parent: AstNode, context?: Context): AstNode | undefined {
    this.p.assertLineStart();
    if (!this.p.peekTokens(t.ASTERISK, t.WHITESPACE)) {
      return undefined;
    }
    const list = new Node(n.UNORDERED_LIST, parent, {
      context,
      startToken: this.p.current,
    });
    const guard = this.p.makeWhileGuard(`BlockParser.parseUnorderedList()`);
    while (guard() && !this.p.peekTokensAnyOf([t.DOUBLE_EOL], [t.EOX, t.EOX])) {
      const item = new Node(n.LIST_ITEM, list);
      item.startToken = this.p.current;
      this.p.consumeMany(t.ASTERISK, t.WHITESPACE);
      item.children = this.p.parseUntil(item, t.EOX);
      item.endToken = this.p.lastNonEOX();
      list.children.push(item);
      if (this.p.currentIs(t.EOL)) {
        this.p.consume();
      }
    }
    list.endToken = this.p.lastNonEOX();
    this.p.consume(t.EOX);
    return list;
  }

  private parseThematicBreak(parent: AstNode, context?: Context): AstNode | undefined {
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
      return new Node(n.THEMATIC_BREAK, parent, { context });
    }
    return undefined;
  }

  private parseChild(block: AstNode): void {
    const context = this.p.parseContext();
    const thematicBreak = this.parseThematicBreak(block, context);
    if (thematicBreak) {
      block.children.push(thematicBreak);
      return;
    }
    const para = new Node(n.PARAGRAPH, block, { context, startToken: this.p.current });
    block.children.push(para);
    para.children = this.p.parseUntilAnyOf(para, [t.DOUBLE_EOL], [t.EOL, t.EOF]);
    para.endToken = this.p.lastNonEOX();
  }

  private consumeTrailingWhitespace(): void {
    if (this.p.currentIs(t.DOUBLE_EOL)) {
      this.p.consume(t.DOUBLE_EOL);
    } else if (this.p.peekTokens(t.EOL, t.EOF)) {
      this.p.consumeMany(t.EOL, t.EOF);
    }
  }

  private prepareCompoundBlock(block: AstNode): void {
    if (block.meta?.subType === `quote`) {
      this.p.consumeMany(QUAD_UNDERSCORE, t.EOL);
      this.p = this.p.getBufferedParser(t.EOL, QUAD_UNDERSCORE, t.EOX);
    } else if (block.meta?.subType == `verse`) {
      this.p.consumeMany(QUAD_UNDERSCORE, t.EOL);
      this.p = this.p.getBufferedParser(QUAD_UNDERSCORE, t.EOX);
    } else if (this.p.peekTokens(t.DOUBLE_DASH, t.DOUBLE_EOL)) {
      block.meta.subType = `open`;
      this.p.consumeMany(t.DOUBLE_DASH, t.DOUBLE_EOL);
      this.p = this.p.getBufferedParser(t.DOUBLE_EOL, t.DOUBLE_DASH, t.EOX);
    } else if (this.p.peekTokensAnyOf([EXAMPLE, t.DOUBLE_EOL])) {
      block.meta.subType = `example`;
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

  private makeBlock(parent: AstNode, context?: Context): AstNode {
    const block = new Node(n.BLOCK, parent, {
      context,
      subType: `paragraph`,
      startToken: this.p.current,
    });
    if (context?.type === `quote` || context?.type === `epigraph`) {
      block.meta.subType = `quote`;
    } else if (context?.type === `verse`) {
      block.meta.subType = `verse`;
    }
    return block;
  }
}

const EXAMPLE: TokenSpec = [t.EQUALS, `====`];
const QUAD_UNDERSCORE: TokenSpec = [t.UNDERSCORE, `____`];
