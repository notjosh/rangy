import createWordOptions, { WordOptions } from "./create-word-options";

export type CharacterOptions = {
  includeBlockContentTrailingSpace: boolean;
  includeSpaceBeforeBr: boolean;
  includeSpaceBeforeBlock: boolean;
  includePreLineTrailingSpace: boolean;
  ignoreCharacters: string;
};

export const defaultCharacterOptions: CharacterOptions = {
  includeBlockContentTrailingSpace: true,
  includeSpaceBeforeBr: true,
  includeSpaceBeforeBlock: true,
  includePreLineTrailingSpace: true,
  ignoreCharacters: "",
};

function createNestedOptions(
  optionsParam: Record<string, unknown>,
  defaults: Record<string, unknown> &
    Partial<{ wordOptions: WordOptions }> &
    Partial<{ characterOptions: CharacterOptions }>
): Record<string, unknown> {
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
