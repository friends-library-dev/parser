import { TOKEN as t, TokenSpec } from '../types';
import Parser from '../Parser';
import ChapterNode from '../nodes/ChapterNode';
import BlockNode from '../nodes/BlockNode';
import ParagraphNode from '../nodes/ParagraphNode';
import ContextParser from './ContextParser';

export default class BlockParser {
  private contextParser: ContextParser;

  public constructor(private p: Parser) {
    this.contextParser = new ContextParser(p);
  }

  public parse(parent: ChapterNode): BlockNode {
    const context = this.contextParser.parse();
    const block = new BlockNode(parent, context);
    const isBlockQuote = context?.isBlockQuote() ?? false;

    if (isBlockQuote) {
      this.p.consume(t.UNDERSCORE, `____`);
      this.p.consume(t.EOL);
    }

    // get block terminator DOUBLE_EOL, [EOL, EOF], UNDERSCORE
    // todo, extract
    if (false) {
      const blockStopTokens: TokenSpec[] = [[t.UNDERSCORE, `____`]];
      const guard = this.p.makeWhileGuard(`BlockParser.parse()`);
      while (guard() && !this.p.peekTokens(...blockStopTokens)) {
        //
      }
    }

    // while ! blockTerminator, get para terminator
    // loop through pushing paras (paras can have context...)

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
