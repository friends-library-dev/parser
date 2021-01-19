import fs from 'fs';
import { sync as glob } from 'glob';
import Lexer from './lexer';
import Parser from './Parser';
import { assertAllNodesHaveTokens } from './__tests__/helpers';

let file = process.argv[2];

if (file === `-p`) {
  file = ``;
}

if (!file) {
  const adocFiles = glob(`${process.cwd()}/{en,es}/**/*.adoc`);
  adocFiles.forEach(lexfile);
} else if (!fs.existsSync(file)) {
  throw new Error(`Invalid file: ${file}`);
} else {
  lexfile(file);
}

function lexfile(file: string): void {
  if (file.includes(`benjamin-bangs`)) {
    return;
  }
  let pattern: string | undefined;
  const patternIndex = process.argv.indexOf(`-p`);
  if (patternIndex !== -1) {
    pattern = process.argv[patternIndex + 1];
    if (!file.includes(pattern || ``)) {
      return;
    }
  }
  const adoc = fs.readFileSync(file, `utf-8`);
  const lexer = new Lexer({ adoc, filename: file });
  const parser = new Parser(lexer);
  const doc = parser.parse();
  assertAllNodesHaveTokens(doc);
}
