import convertCharRangeToToken from "./convert-char-range-to-token";
import { WordOptions } from "./create-word-options";
import { Token, TokenChar, TokenRange } from "./default-tokenizer";

type TokenizerFunc = (
  chars: TokenChar[],
  wordOptions: WordOptions
) => TokenRange[];

function tokenize(
  chars: TokenChar[],
  wordOptions: WordOptions,
  tokenizer: TokenizerFunc
): Token[] {
  var tokenRanges = tokenizer(chars, wordOptions);
  var tokens: Token[] = [];
  for (let i = 0, tokenRange: TokenRange; (tokenRange = tokenRanges[i++]); ) {
    tokens.push(convertCharRangeToToken(chars, tokenRange));
  }
  return tokens;
}

export default tokenize;
