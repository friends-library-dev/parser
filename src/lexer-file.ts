import fs from 'fs';
import { sync as glob } from 'glob';
import Lexer from './lexer';
import Parser from './Parser';
import ContextParser from './parsers/ContextParser';

let numIllegals = 0;
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
  const adoc = fs.readFileSync(file, `utf-8`);
  const lines = adoc.split(`\n`);
  lines.forEach((line, idx) => {
    if (line[0] === `[` && line.match(/\]$/) && !line.includes(`cols`)) {
      const lexer = new Lexer({ adoc: `${line}\n`, filename: file });
      const parser = new Parser(lexer);
      const cp = new ContextParser(parser);
      try {
        cp.parse();
      } catch (e) {
        console.log(`err at ${file}:${idx + 1}`);
        console.log(e.message, `\n`);
      }
    }
  });
}
