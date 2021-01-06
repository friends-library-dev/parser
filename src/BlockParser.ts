import { TOKEN as t } from './types';
import Parser from './Parser';
import ChapterNode from './nodes/ChapterNode';
import BlockNode from './nodes/BlockNode';
import ParagraphNode from './nodes/ParagraphNode';

export default class BlockParser {
  public constructor(private p: Parser) {}

  public parse(parent: ChapterNode): BlockNode {
    const block = new BlockNode(parent);

    // temp, ignore open/example blocks, parse single para block for now...
    const stopTokens = this.isLastChunkInFile() ? [t.EOL, t.EOF] : [t.DOUBLE_EOL];
    // @TODO, maybe make a ParagraphParser??? ¯\_(ツ)_/¯
    const paragraph = new ParagraphNode(block);
    block.children = [paragraph];
    paragraph.children = this.p.parseUntil(paragraph, ...stopTokens);
    // block.children = this.p.parseUntil(block)

    return block;
  }

  private isLastChunkInFile(): boolean {
    let guard = this.p.makeWhileGuard(`BlockParser.isLastChunkInFile()`);
    let tokenLookaheadIndex = 0;
    while (guard()) {
      const token = this.p.lookAhead(tokenLookaheadIndex);
      tokenLookaheadIndex += 1;
      if (token.type === t.EOF) {
        return true;
      } else if (token.type === t.DOUBLE_EOL) {
        return false;
      }
    }
    throw new Error(`Unexpected exit of while loop`);
  }
}
