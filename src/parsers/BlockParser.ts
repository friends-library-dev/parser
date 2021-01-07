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
    const guard = this.p.makeWhileGuard(`BlockParser.parse()`);
    while (guard() && !this.p.peekTokensAnyOf(...[...blockStops, ...paraStops])) {
      const paragraph = new ParagraphNode(block);
      block.children.push(paragraph);
      paragraph.children = this.p.parseUntilAnyOf(paragraph, ...paraStops);
    }

    return block;
  }

  private stopTokens(
    block: BlockNode,
  ): [blockStops: TokenSpec[][], paraStops: TokenSpec[][]] {
    const blockStops: TokenSpec[][] = [[t.EOL, t.EOF]];
    const paraStops: TokenSpec[][] = [[t.DOUBLE_EOL]];

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
