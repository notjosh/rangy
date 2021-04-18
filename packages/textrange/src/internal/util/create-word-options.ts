import { defaultLanguage, defaultWordOptionsWithLanguage } from '../constants';
import { TokenChar, TokenRange } from './default-tokenizer';

export type WordOptions = {
  wordRegex: RegExp;
  includeTrailingSpace: boolean;
  tokenizer: (chars: TokenChar[], wordOptions: WordOptions) => TokenRange[];
};

function createWordOptions(
  options?: Partial<WordOptions> & Partial<{ language: string }>
): WordOptions {
  if (options == null) {
    return defaultWordOptionsWithLanguage[defaultLanguage];
  } else {
    const lang = options.language || defaultLanguage;
    return {
      ...(defaultWordOptionsWithLanguage[lang] ??
        defaultWordOptionsWithLanguage[defaultLanguage]),
      ...options,
    };
  }
}

export default createWordOptions;
