import { dom } from '@rangy/core';

// Test for old IE's incorrect display properties
var tableCssDisplayBlock: boolean;
(function () {
  var table = document.createElement('table');
  var body = dom.getBody(document);
  body.appendChild(table);
  tableCssDisplayBlock =
    dom.getComputedStyleProperty(table, 'display') == 'block';
  body.removeChild(table);
})();

const defaultDisplayValueForTag = {
  table: 'table',
  caption: 'table-caption',
  colgroup: 'table-column-group',
  col: 'table-column',
  thead: 'table-header-group',
  tbody: 'table-row-group',
  tfoot: 'table-footer-group',
  tr: 'table-row',
  td: 'table-cell',
  th: 'table-cell',
};

// Corrects IE's "block" value for table-related elements
function getComputedDisplay(el: Element, win?: Window): string {
  var display = dom.getComputedStyleProperty(el, 'display', win);
  var tagName = el.tagName.toLowerCase();
  return display === 'block' &&
    tableCssDisplayBlock &&
    defaultDisplayValueForTag.hasOwnProperty(tagName)
    ? defaultDisplayValueForTag[tagName]
    : display;
}

export default getComputedDisplay;
