import fs from 'fs';
import { sync as glob } from 'glob';
import Lexer from './lexer';
import Parser from './Parser';

const file = process.argv[2];

if (!file) {
  const adocFiles = glob(`${process.cwd()}/{en,es}/**/*.adoc`);
  adocFiles.forEach(lexfile);
} else if (!fs.existsSync(file)) {
  throw new Error(`Invalid file: ${file}`);
} else {
  lexfile(file);
}

function lexfile(file: string): void {
  // console.log(file);
  const adoc = fs.readFileSync(file, `utf-8`);
  const lexer = new Lexer({ adoc, filename: file });
  const parser = new Parser(lexer);
  parser.parse();
}
