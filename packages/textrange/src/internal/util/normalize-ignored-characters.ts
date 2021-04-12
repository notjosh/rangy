function normalizeIgnoredCharacters(
  ignoredCharacters: string | string[] | null | undefined
): string {
  // Check if character is ignored
  const ignoredChars = ignoredCharacters ?? "";

  // Normalize ignored characters into a string consisting of characters in ascending order of character code
  const ignoredCharsArray =
    typeof ignoredChars == "string" ? ignoredChars.split("") : ignoredChars;
  ignoredCharsArray.sort(
    (char1, char2) => char1.charCodeAt(0) - char2.charCodeAt(0)
  );

  /// Convert back to a string and remove duplicates
  return ignoredCharsArray.join("").replace(/(.)\1+/g, "$1");
}

export default normalizeIgnoredCharacters;
