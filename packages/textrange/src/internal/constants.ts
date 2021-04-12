import { dom, getSelection, WrappedRange } from "@rangy/core";
import { CharacterOptions } from "./util/create-nested-options";
import { WordOptions } from "./util/create-word-options";

export const spacesRegex = /^[ \t\f\r\n]+$/;
export const spacesMinusLineBreaksRegex = /^[ \t\f\r]+$/;
export const allWhiteSpaceRegex = /^[\t-\r \u0085\u00A0\u1680\u180E\u2000-\u200B\u2028\u2029\u202F\u205F\u3000]+$/;
export const nonLineBreakWhiteSpaceRegex = /^[\t \u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000]+$/;
export const lineBreakRegex = /^[\n-\r\u0085\u2028\u2029]$/;

export const defaultLanguage = "en";

export const UNDEF = "undefined";
export const CHARACTER = "character";
export const WORD = "word";

export type ExpandOptions = {
  wordOptions: WordOptions;
  characterOptions: CharacterOptions;
  trim: boolean;
  trimStart: boolean;
  trimEnd: boolean;
};

export type FindOptions = {
  caseSensitive: boolean;
  withinRange?: WrappedRange;
  wholeWordsOnly: boolean;
  wrap: boolean;
  direction: "forward" | "backward";
  wordOptions?: WordOptions;
  characterOptions?: CharacterOptions;
};

export type CaretCharacterOptions = {
  includeBlockContentTrailingSpace: boolean;
  includeSpaceBeforeBr: boolean;
  includeSpaceBeforeBlock: boolean;
  includePreLineTrailingSpace: boolean;
};

export type WordIteratorOptions = {
  wordOptions?: WordOptions;
  characterOptions?: CharacterOptions;
  direction: "forward" | "backward";
};

export const defaultExpandOptions: ExpandOptions = {
  wordOptions: null,
  characterOptions: null,
  trim: false,
  trimStart: true,
  trimEnd: true,
};

export const defaultFindOptions: FindOptions = {
  caseSensitive: false,
  withinRange: null,
  wholeWordsOnly: false,
  wrap: false,
  direction: "forward",
  wordOptions: null,
  characterOptions: null,
};

export const defaultWordIteratorOptions: WordIteratorOptions = {
  wordOptions: null,
  characterOptions: null,
  direction: "forward",
};

// Properties representing whether trailing spaces inside blocks are completely collapsed (as they are in WebKit,
// but not other browsers). Also test whether trailing spaces before <br> elements are collapsed.
var trailingSpaceInBlockCollapses = false;
var trailingSpaceBeforeBrCollapses = false;
var trailingSpaceBeforeBlockCollapses = false;
var trailingSpaceBeforeLineBreakInPreLineCollapses = true;

(function () {
  var el = dom.createTestElement(document, "<p>1 </p><p></p>", true);
  var p = el.firstChild;
  var sel = getSelection();
  sel.collapse(p.lastChild, 2);
  sel.setStart(p.firstChild, 0);
  trailingSpaceInBlockCollapses = ("" + sel).length == 1;

  el.innerHTML = "1 <br />";
  sel.collapse(el, 2);
  sel.setStart(el.firstChild, 0);
  trailingSpaceBeforeBrCollapses = ("" + sel).length == 1;

  el.innerHTML = "1 <p>1</p>";
  sel.collapse(el, 2);
  sel.setStart(el.firstChild, 0);
  trailingSpaceBeforeBlockCollapses = ("" + sel).length == 1;

  dom.removeNode(el);
  sel.removeAllRanges();
})();

export const defaultCaretCharacterOptions: CaretCharacterOptions = {
  includeBlockContentTrailingSpace: !trailingSpaceBeforeLineBreakInPreLineCollapses,
  includeSpaceBeforeBr: !trailingSpaceBeforeBrCollapses,
  includeSpaceBeforeBlock: !trailingSpaceBeforeBlockCollapses,
  includePreLineTrailingSpace: true,
};
