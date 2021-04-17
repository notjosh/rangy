import * as rangy from '@rangy/core';
import * as classapplier from '@rangy/classapplier';
import * as highlighter from '@rangy/highlighter';
import { createRangeInHtml } from '@rangy/test-util/testutils';
import '@rangy/test-util/qunit-ex';

QUnit.module('Highlighter module tests');

QUnit.test('highlightSelection test', function (t) {
  var applier = classapplier.createClassApplier('c1');
  var highlighter = highlighter.createHighlighter();
  highlighter.addClassApplier(applier);

  var testEl = document.getElementById('test');
  var range = createRangeInHtml(testEl, 'one [two] three four');
  range.select();

  var highlights = highlighter.highlightSelection('c1');

  t.equal(highlights.length, 1);

  //t.assertEquals(highlights.length, 1);
});

QUnit.test('Options test (issue 249)', function (t) {
  var applier = classapplier.createClassApplier('c1');
  var highlighter = highlighter.createHighlighter();
  highlighter.addClassApplier(applier);

  highlighter.highlightSelection('c1', { selection: rangy.getSelection() });
});
