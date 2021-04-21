import { CharacterOptions, defaultCharacterOptions } from '../constants';
import createWordOptions, { WordOptions } from './create-word-options';

function createNestedOptions<
  T extends Record<string, unknown> &
    Partial<{ wordOptions: WordOptions }> &
    Partial<{ characterOptions: CharacterOptions }>
>(optionsParam: Record<string, unknown>, defaults: T): T {
  const options = { ...defaults, ...optionsParam };

  if (defaults.wordOptions != null) {
    options.wordOptions = createWordOptions(options.wordOptions);
  }

  if (defaults.characterOptions != null) {
    options.characterOptions = {
      ...defaultCharacterOptions,
      ...options.characterOptions,
    };
  }

  return options;
}

export default createNestedOptions;
