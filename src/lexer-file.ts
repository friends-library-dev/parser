import fs from 'fs';
import { sync as glob } from 'glob';
import Lexer from './lexer';

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
  const lexer = new Lexer({ adoc, filename: file });

  let token: any;
  do {
    token = lexer.nextToken();
    if (token.type === `ILLEGAL`) {
      numIllegals++;
      console.log(`"${token.literal}" - ${token.filename}:${token.line}`);
      if (numIllegals > 50) {
        console.log(`---stopped early---`);
        process.exit(1);
      }
    }
  } while (token.type !== `EOF`);
}
