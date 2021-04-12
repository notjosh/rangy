export {
  // from ./domrange
  RangeBase,
  RangyRange,
  RangyRangeEx,
  rangesEqual,
  getRangeDocument,
  createPrototypeRange,
  DomRange,
  createRangyRange,
  createNativeRange,
  createRange,
  // /** @deprecated */
  // createRange as createIframeRange,
  shimCreateRange,
  // from ./wrappedselection
  getNativeSelection,
  isSelectionValid,
  getSelection,
  // /** @deprecated */
  // getSelection as getIframeSelection,

  RangeIterator,
  shimGetSelection,
  // from ./wrappedrange
  WrappedRange,
  WrappedSelection,
  WrappedSelection as Selection, //alias
} from "./_";
