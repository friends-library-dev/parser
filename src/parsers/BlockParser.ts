import { AstChildNode, TOKEN as t, TokenSpec, TokenType } from '../types';
import Parser from '../Parser';
import BlockNode from '../nodes/BlockNode';
import ParagraphNode from '../nodes/ParagraphNode';

export default class BlockParser {
  public constructor(private p: Parser) {}

  public parse(parent: AstChildNode): BlockNode {
    const context = this.p.parseContext();
    const block = new BlockNode(parent, context);

    if (this.p.peekTokens(t.DOUBLE_DASH, t.DOUBLE_EOL)) {
      block.blockType = `open`;
    } else if (this.p.peekTokens([t.EQUALS, `====`], t.DOUBLE_EOL)) {
      block.blockType = `example`;
    }

    this.consumeDelimeters(block, 'open');

    const [blockStops, paraStops] = this.stopTokens(block);
    const outerGuard = this.p.makeWhileGuard(`BlockParser.parse(<outer>)`);
    while (outerGuard() && !this.p.peekTokensAnyOf(...blockStops)) {
      console.log(`outer`);
      const innerGuard = this.p.makeWhileGuard(`BlockParser.parse(<inner>)`);
      while (innerGuard() && !this.p.peekTokensAnyOf(...paraStops)) {
        this.p.log('inner', 2);
        console.log({ blockStops, paraStops });
        if (this.peekStartInnerBlock(block)) {
          // this.p.log(`${lol}-b`, 4);
          this.p.log('sub-parse', 6);
          const innerBlockParser = new BlockParser(this.p);
          const innerBlock = innerBlockParser.parse(block);
          block.children.push(innerBlock);
        } else if (!this.p.currentIs([t.EQUALS, `====`])) {
          this.p.log('para-parse');
          const paragraph = new ParagraphNode(block, this.p.parseContext());
          block.children.push(paragraph);
          paragraph.children = this.p.parseUntilAnyOf(paragraph, ...paraStops);
        } else {
          this.p.log('else consume', 5);
          this.consumeDelimeters(block, 'close');
        }
        // block.children.forEach((c) => c.log());
        // this.
        this.p.log(`pre-consume`, 4);
        if (this.p.currentIs(t.DOUBLE_EOL)) {
          this.p.consume(t.DOUBLE_EOL);
        }
        this.p.log(`post-consume`, 4);
        // this.consumeDelimeters(block, 'close');
      }
    }

    console.log(`exit`, block.blockType);
    this.consumeDelimeters(block, 'close');
    return block;
  }

  private peekStartInnerBlock(block: BlockNode): boolean {
    const token = this.p.firstTokenAfterOptionalContext();
    const isFourEq = token.type === t.EQUALS && token.literal === `====`;
    if (isFourEq && block.blockType !== `example`) {
      return true;
    }
    return false;
  }

  private consumeDelimeters(block: BlockNode, side: 'open' | 'close'): void {
    switch (block.blockType) {
      case `quote`:
        this.p.consume(t.UNDERSCORE, `____`);
        this.p.consume(t.EOL);
        break;

      // syntax for open blocks and example block is the same, except for the token
      case `open`:
      case `example`: // fallthrough
        const typeDelim: [TokenType, string | undefined] =
          block.blockType === `open` ? [t.DOUBLE_DASH, undefined] : [t.EQUALS, `====`];
        if (side === `open`) {
          this.p.consume(...typeDelim);
          this.p.consume(t.DOUBLE_EOL);
        } else {
          this.p.consume(...typeDelim);
          if (this.p.currentIs(t.EOL)) {
            this.p.consume(t.EOL);
          } else {
            this.p.consume(t.DOUBLE_EOL);
          }
        }
        break;
    }
  }

  private stopTokens(
    block: BlockNode,
  ): [blockStops: TokenSpec[][], paraStops: TokenSpec[][]] {
    const blockStops: TokenSpec[][] = [
      [t.EOL, t.EOF],
      [t.EOF],
      [[t.UNDERSCORE, `____`], t.EOL],
      [[t.EQUALS, `====`], t.EOL],
      [t.DOUBLE_DASH, t.EOL],
    ];
    const paraStops: TokenSpec[][] = [[t.DOUBLE_EOL], [t.EOF]];
    if (block.blockType === `paragraph`) {
      blockStops.push([t.DOUBLE_EOL]);
    }
    return [blockStops, paraStops];

    if (block.blockType === `quote`) {
      blockStops.push([[t.UNDERSCORE, `____`]]);
      paraStops.push([[t.UNDERSCORE, `____`]]);
    } else if (block.blockType === `open`) {
      blockStops.push([t.DOUBLE_DASH, t.EOL]);
      paraStops.push([t.DOUBLE_DASH, t.EOL]);
    } else if (block.blockType === `example`) {
      blockStops.push([[t.EQUALS, `====`], t.EOL]);
      paraStops.push([[t.EQUALS, `====`], t.EOL]);
    } else {
      blockStops.push([t.DOUBLE_EOL]);
      paraStops.push([t.EOL, t.EOF]);
    }

    return [blockStops, paraStops];
  }
}
