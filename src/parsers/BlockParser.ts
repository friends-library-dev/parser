import { TOKEN as t, TokenSpec } from '../types';
import Parser from '../Parser';
import ChapterNode from '../nodes/ChapterNode';
import BlockNode from '../nodes/BlockNode';
import ParagraphNode from '../nodes/ParagraphNode';

export default class BlockParser {
  public constructor(private p: Parser) {}

  public parse(parent: ChapterNode): BlockNode {
    const context = this.p.parseContext();
    const block = new BlockNode(parent, context);
    const isBlockQuote = context?.isBlockQuote() ?? false;

    if (isBlockQuote) {
      this.p.consume(t.UNDERSCORE, `____`);
      this.p.consume(t.EOL);
    }

    const [blockStops, paraStops] = this.stopTokens(block);
    const guard = this.p.makeWhileGuard(`BlockParser.parse(<outer>)`);
    while (guard() && !this.p.peekTokensAnyOf(...blockStops)) {
      const innerGuard = this.p.makeWhileGuard(`BlockParser.parse(<inner>)`);
      while (innerGuard() && !this.p.peekTokensAnyOf(...paraStops)) {
        const paragraph = new ParagraphNode(block);
        block.children.push(paragraph);
        paragraph.children = this.p.parseUntilAnyOf(paragraph, ...paraStops);
        if (this.p.currentIs(t.DOUBLE_EOL)) {
          this.p.consume(t.DOUBLE_EOL);
        }
      }
    }

    return block;
  }

  private stopTokens(
    block: BlockNode,
  ): [blockStops: TokenSpec[][], paraStops: TokenSpec[][]] {
    const blockStops: TokenSpec[][] = [[t.EOL, t.EOF], [t.EOF]];
    const paraStops: TokenSpec[][] = [[t.DOUBLE_EOL], [t.EOF]];

    if (block.context?.isBlockQuote()) {
      blockStops.push([[t.UNDERSCORE, `____`]]);
      paraStops.push([[t.UNDERSCORE, `____`]]);
    } else {
      blockStops.push([t.DOUBLE_EOL]);
      paraStops.push([t.EOL, t.EOF]);
    }

    return [blockStops, paraStops];
  }
}
