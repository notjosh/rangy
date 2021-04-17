import { defaultLanguage } from '../constants';
import defaultTokenizer, { TokenChar, TokenRange } from './default-tokenizer';

const defaultWordOptions: Record<string, WordOptions> = {
  [defaultLanguage]: {
    wordRegex: /[a-z0-9]+('[a-z0-9]+)*/gi,
    includeTrailingSpace: false,
    tokenizer: defaultTokenizer,
  },
};

export type WordOptions = {
  wordRegex: RegExp;
  includeTrailingSpace: boolean;
  tokenizer: (chars: TokenChar[], wordOptions: WordOptions) => TokenRange[];
};

function createWordOptions(
  options?: Partial<WordOptions> & Partial<{ language: string }>
): WordOptions {
  if (options == null) {
    return defaultWordOptions[defaultLanguage];
  } else {
    const lang = options.language || defaultLanguage;
    return {
      ...(defaultWordOptions[lang] ?? defaultWordOptions[defaultLanguage]),
      ...options,
    };
  }
}

export default createWordOptions;
