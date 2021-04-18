import * as rangy from '@rangy/core';
import * as textRange from '@rangy/textrange';
import '@rangy/test-util';
import type { FindOptions } from '@rangy/textrange/dist/types/internal/constants';

const container = document.createElement('div');
container.id = 'rangy-container';
document.body.appendChild(container);

let el: HTMLElement | null = document.createElement('div');
el.innerHTML = '1  2';
const textNodeSpacesCollapsed = (el.firstChild as Text).length == 3;

QUnit.log((details) => {
  console.log(`Log: ${details.result}, ${details.message}`);
});

QUnit.module('Text Range module tests', {
  beforeEach: () => {
    el = document.createElement('div') as HTMLElement;
    el.id = 'el';
    container.appendChild(el);
    console.log('(append)', { parentElement: el.parentElement });
  },
  afterEach: () => {
    if (el != null) {
      // container.removeChild(el);
      // console.log('(removed)');
    }
    //textRange.endTransaction();
  },
});

function testRangeBoundaries(
  t: Assert,
  range: rangy.WrappedRange,
  startNode: Node,
  startOffset: number,
  endNode: Node,
  endOffset: number
) {
  t.equal(range.startContainer, startNode);
  t.equal(range.startOffset, startOffset);
  t.equal(range.endContainer, endNode);
  t.equal(range.endOffset, endOffset);
}

function testCollapsedRangeBoundaries(
  t: Assert,
  range: rangy.WrappedRange,
  startNode: Node,
  startOffset: number
) {
  t.equal(range.startContainer, startNode);
  t.equal(range.startOffset, startOffset);
  t.ok(range.collapsed);
}

QUnit.test('Next/previous node tests', function (t) {
  var div0 = document.createElement('div');
  var text1_1 = div0.appendChild(document.createTextNode('1'));
  var b1 = div0.appendChild(document.createElement('b'));
  var text2 = b1.appendChild(document.createTextNode('2'));
  var i2 = b1.appendChild(document.createElement('i'));
  var text3 = i2.appendChild(document.createTextNode('3'));
  var text1_2 = div0.appendChild(document.createTextNode('1'));

  var nexts = [],
    next = div0 as Node;
  while ((next = textRange.nextNode(next))) {
    nexts.push(next);
  }

  t.deepEqual(nexts, [text1_1, b1, text2, i2, text3, text1_2]);

  var previouses = [],
    previous = text1_2 as Node;
  while ((previous = textRange.previousNode(previous))) {
    previouses.push(previous);
  }

  t.deepEqual(previouses.slice(0, 6), [text3, i2, text2, b1, text1_1, div0]);
});

QUnit.test('nextPosition and previousPosition', function (t) {
  el.innerHTML = '<div>1<b>2<br><span></span>33</b>4</div>';

  var div = el.getElementsByTagName('div')[0];
  var text1 = div.firstChild;
  var b = text1.nextSibling;
  var t2 = b.firstChild;
  var br = t2.nextSibling;
  var span = br.nextSibling;
  var t3 = b.lastChild;
  var t4 = div.lastChild;

  var positions = [
    [div, 0],
    [text1, 0],
    [text1, 1],
    [div, 1],
    [b, 0],
    [t2, 0],
    [t2, 1],
    [b, 1],
    [b, 2],
    [span, 0],
    [b, 3],
    [t3, 0],
    [t3, 1],
    [t3, 2],
    [b, 4],
    [div, 2],
    [t4, 0],
    [t4, 1],
    [div, 3],
    [el, 1],
  ];

  textRange.noMutation(function () {
    var pos = textRange.createPosition(el, 0);

    // First forwards...
    for (var i = 0; i < positions.length; ++i) {
      pos = pos.next();
      t.equal(pos.node, positions[i][0]);
      t.equal(pos.offset, positions[i][1]);
    }

    // ... now backwards
    for (i = positions.length - 2; i >= 0; --i) {
      pos = pos.previous();
      t.equal(pos.node, positions[i][0]);
      t.equal(pos.offset, positions[i][1]);
    }
  });
});

QUnit.test('Visible position iteration', function (t) {
  el.innerHTML =
    '<div>1<b style="display: none">2<br></b><script>var foo = 1</script><span></span><br></div><div>2</div>';

  var div1 = el.getElementsByTagName('div')[0];
  var text1 = div1.firstChild;
  var span = el.getElementsByTagName('span')[0];
  var div2 = el.getElementsByTagName('div')[1];
  var text2 = div2.firstChild;

  var positions = [
    [div1, 0],
    [text1, 0],
    [text1, 1],
    [div1, 1],
    [div1, 2],
    [div1, 3],
    [span, 0],
    [div1, 4],
    [div1, 5],
    [el, 1],
    [div2, 0],
    [text2, 0],
    [text2, 1],
    [div2, 1],
    [el, 2],
  ];

  textRange.noMutation(function () {
    var pos = textRange.createPosition(el, 0);

    // First forwards...
    for (var i = 0; i < positions.length; ++i) {
      pos = pos.nextVisible();
      t.equal(pos.node, positions[i][0], pos.inspect());
      t.equal(pos.offset, positions[i][1], pos.inspect());
    }

    // ... now backwards
    for (i = positions.length - 2; i >= 0; --i) {
      pos = pos.previousVisible();
      t.equal(pos.node, positions[i][0], pos.inspect());
      t.equal(pos.offset, positions[i][1], pos.inspect());
    }
  });
});

QUnit.test('innerText on simple text', function (t) {
  el.innerHTML = 'One Two';
  t.equal(textRange.innerText(el), 'One Two');
});

QUnit.test('innerText on simple text with double space', function (t) {
  el.innerHTML = 'One  Two';
  t.equal(textRange.innerText(el), 'One Two');
});

QUnit.test('innerText on simple text with triple space', function (t) {
  el.innerHTML = 'One   Two';
  t.equal(textRange.innerText(el), 'One Two');
});

QUnit.test('innerText on simple text with non-breaking space', function (t) {
  el.innerHTML = 'One &nbsp; Two';
  t.equal(textRange.innerText(el), 'One \u00a0 Two');
});

QUnit.test('innerText on simple text with leading space', function (t) {
  el.innerHTML = ' One Two';
  t.equal(textRange.innerText(el), 'One Two');
});

QUnit.test(
  'innerText on paragraph with trailing space (includeBlockContentTrailingSpace true)',
  function (t) {
    el.innerHTML = '<div>x </div><div>y</div>';
    t.equal(
      textRange.innerText(el, {
        includeBlockContentTrailingSpace: true,
      }),
      'x \ny'
    );
  }
);

QUnit.test(
  'innerText on paragraph with trailing space (includeBlockContentTrailingSpace false)',
  function (t) {
    el.innerHTML = '<div>x </div><div>y</div>';
    t.equal(
      textRange.innerText(el, {
        includeBlockContentTrailingSpace: false,
      }),
      'x\ny'
    );
  }
);

QUnit.test(
  'innerText on paragraph containing br preceded by space (includeSpaceBeforeBr true)',
  function (t) {
    el.innerHTML = '<div>x <br>y</div>';
    t.equal(
      textRange.innerText(el, {
        includeSpaceBeforeBr: true,
      }),
      'x \ny'
    );
  }
);

QUnit.test(
  'innerText on paragraph containing br preceded by space (includeSpaceBeforeBr false)',
  function (t) {
    el.innerHTML = '<div>x <br>y</div>';
    t.equal(
      textRange.innerText(el, {
        includeSpaceBeforeBr: false,
      }),
      'x\ny'
    );
  }
);

QUnit.test(
  'innerText on paragraph containing br preceded by two spaces (includeSpaceBeforeBr true)',
  function (t) {
    el.innerHTML = '<div>x  <br>y</div>';
    t.equal(
      textRange.innerText(el, {
        includeSpaceBeforeBr: true,
      }),
      'x \ny'
    );
  }
);

QUnit.test(
  'innerText on paragraph containing br preceded by two spaces (includeSpaceBeforeBr false)',
  function (t) {
    el.innerHTML = '<div>x  <br>y</div>';
    t.equal(
      textRange.innerText(el, {
        includeSpaceBeforeBr: false,
      }),
      'x\ny'
    );
  }
);

QUnit.test(
  'innerText on simple text with two trailing spaces (includeBlockContentTrailingSpace true)',
  function (t) {
    el.innerHTML = '1  ';
    t.equal(
      textRange.innerText(el, {
        includeBlockContentTrailingSpace: true,
      }),
      '1 '
    );
  }
);

QUnit.test(
  'innerText on simple text with two trailing spaces (includeBlockContentTrailingSpace false)',
  function (t) {
    el.innerHTML = '1  ';
    t.equal(
      textRange.innerText(el, {
        includeBlockContentTrailingSpace: false,
      }),
      '1'
    );
  }
);

QUnit.test('innerText on simple text with leading space in span', function (t) {
  el.innerHTML = '<span> </span>One Two';
  t.equal(textRange.innerText(el), 'One Two');
});

QUnit.test(
  'innerText on simple text with trailing space in span (includeBlockContentTrailingSpace true)',
  function (t) {
    el.innerHTML = 'One Two<span> </span>';
    t.equal(
      textRange.innerText(el, {
        includeBlockContentTrailingSpace: true,
      }),
      'One Two '
    );
  }
);

QUnit.test(
  'innerText on simple text with trailing space in span (includeBlockContentTrailingSpace false)',
  function (t) {
    el.innerHTML = 'One Two<span> </span>';
    t.equal(
      textRange.innerText(el, {
        includeBlockContentTrailingSpace: false,
      }),
      'One Two'
    );
  }
);

QUnit.test(
  'innerText on simple text with non-breaking space in span',
  function (t) {
    el.innerHTML = '1 <span>&nbsp; </span>2';
    t.equal(textRange.innerText(el), '1 \u00a0 2');
  }
);

QUnit.test(
  'innerText on simple text with non-breaking space in span 2',
  function (t) {
    el.innerHTML = '1<span> &nbsp; </span>2';
    t.equal(textRange.innerText(el), '1 \u00a0 2');
  }
);

QUnit.test(
  'innerText on simple text with non-breaking space in span 3',
  function (t) {
    el.innerHTML = '1<span> &nbsp;</span> 2';
    t.equal(textRange.innerText(el), '1 \u00a0 2');
  }
);

QUnit.test('innerText on one paragraph', function (t) {
  el.innerHTML = '<p>1</p>';
  t.equal(textRange.innerText(el), '1');
});

QUnit.test('innerText on two paragraphs', function (t) {
  el.innerHTML = '<p>1</p><p>2</p>';
  t.equal(textRange.innerText(el), '1\n2');
});

QUnit.test('innerText on two paragraphs separated by one space', function (t) {
  el.innerHTML = '<p>x</p> <p>y</p>';
  t.equal(textRange.innerText(el), 'x\ny');
});

QUnit.test(
  'innerText on two paragraphs separated by one line break',
  function (t) {
    el.innerHTML = '<p>x</p>\n<p>y</p>';
    t.equal(textRange.innerText(el), 'x\ny');
  }
);

QUnit.test(
  'innerText on two paragraphs separated by two line breaks',
  function (t) {
    el.innerHTML = '<p>x</p>\n\n<p>y</p>';
    t.equal(textRange.innerText(el), 'x\ny');
  }
);

QUnit.test('innerText on two paragraphs with container', function (t) {
  el.innerHTML = '<div><p>1</p><p>2</p></div>';
  t.equal(textRange.innerText(el), '1\n2');
});

QUnit.test('innerText on table', function (t) {
  el.innerHTML =
    '<table><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></table>';
  t.equal(textRange.innerText(el), '1\t2\n3\t4');
});

QUnit.test('innerText with hidden p element', function (t) {
  el.innerHTML = '<p>1</p><p style="display: none">2</p><p>3</p>';
  t.equal(textRange.innerText(el), '1\n3');
});

QUnit.test('innerText with invisible p', function (t) {
  el.innerHTML = '<p>1</p><p style="visibility: hidden">2</p><p>3</p>';
  t.equal(textRange.innerText(el), '1\n3');
});

QUnit.test('innerText on paragraph with uncollapsed br', function (t) {
  el.innerHTML = '<p>1<br>2</p>';
  t.equal(textRange.innerText(el), '1\n2');
});

QUnit.test('innerText on paragraph with two uncollapsed brs', function (t) {
  el.innerHTML = '<p>1<br><br>2</p>';
  t.equal(textRange.innerText(el), '1\n\n2');
});

QUnit.test('innerText on two paragraphs with collapsed br', function (t) {
  el.innerHTML = '<p>1<br></p><p>2</p>';
  t.equal(textRange.innerText(el), '1\n2');
});

QUnit.test('innerText one paragraph with collapsed br ', function (t) {
  el.innerHTML = '<p>1<br></p>';
  t.equal(
    textRange.innerText(el, { includeBlockContentTrailingSpace: false }),
    '1'
  );
});

QUnit.test('innerText on empty element', function (t) {
  el.innerHTML = '';
  t.equal(textRange.innerText(el), '');
});

QUnit.test('innerText on text node followed by block element', function (t) {
  el.innerHTML = '1<div>2</div>';
  t.equal(textRange.innerText(el), '1\n2');
});

QUnit.test('innerText on two consecutive block elements', function (t) {
  el.innerHTML = '<div>1</div><div>2</div>';
  t.equal(textRange.innerText(el), '1\n2');
});

QUnit.test(
  'innerText on two block elements separated by a space',
  function (t) {
    el.innerHTML = '<div>1</div> <div>2</div>';
    t.equal(textRange.innerText(el), '1\n2');
  }
);

QUnit.test('innerText() on block element with leading space', function (t) {
  el.innerHTML = '<p contenteditable="true"> One</p>';
  var p = el.getElementsByTagName('p')[0];
  t.equal(textRange.innerText(p), 'One');
});

QUnit.test(
  'innerText() on block element with leading space following block element',
  function (t) {
    el.innerHTML = '<div>1</div><div> 2</div>';
    t.equal(textRange.innerText(el), '1\n2');
  }
);

QUnit.test(
  'innerText() on block element with leading space following block element and a space',
  function (t) {
    el.innerHTML = '<div>1</div> <div> 2</div>';
    t.equal(textRange.innerText(el), '1\n2');
  }
);

QUnit.test(
  'innerText() on block element with leading space and preceding text',
  function (t) {
    el.innerHTML = '1<p contenteditable="true"> One</p>';
    var p = el.getElementsByTagName('p')[0];
    t.equal(textRange.innerText(p), 'One');
  }
);

QUnit.test('innerText() with ignored characters', function (t) {
  el.innerHTML = '123';
  t.equal(textRange.innerText(el, { ignoreCharacters: '1' }), '23');
  t.equal(textRange.innerText(el, { ignoreCharacters: '2' }), '13');
  t.equal(textRange.innerText(el, { ignoreCharacters: '3' }), '12');
  t.equal(textRange.innerText(el, { ignoreCharacters: '23' }), '1');
  t.equal(textRange.innerText(el, { ignoreCharacters: '123' }), '');
  t.equal(textRange.innerText(el, { ignoreCharacters: ['3'] }), '12');
  t.equal(textRange.innerText(el, { ignoreCharacters: ['2', '3'] }), '1');
});

QUnit.test('innerText() with ignored space characters', function (t) {
  el.innerHTML = '1&nbsp; 2';
  t.equal(textRange.innerText(el), '1\u00a0 2');
  t.equal(textRange.innerText(el, { ignoreCharacters: '\u00a0' }), '1 2');
  t.equal(textRange.innerText(el, { ignoreCharacters: ' ' }), '1\u00a02');
  t.equal(textRange.innerText(el, { ignoreCharacters: '\u00a0 ' }), '12');
});

QUnit.test('innerText() with ignored new line characters', function (t) {
  el.innerHTML = '<p>1</p><p>2</p>';
  t.equal(textRange.innerText(el), '1\n2');
  t.equal(textRange.innerText(el, { ignoreCharacters: '\n' }), '12');
});

QUnit.test('range text() on collapsed range', function (t) {
  el.innerHTML = '12345';
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.collapseToPoint(textNode, 1);
  t.equal(range.text(), '');
});

QUnit.test('range text() on empty range', function (t) {
  el.innerHTML = '<span style="display: none">one</span>';
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.selectNodeContents(el);
  t.equal(range.text(), '');
});

QUnit.test('range text() on simple text', function (t) {
  el.innerHTML = '12345';
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.selectNodeContents(el);
  t.equal(range.text(), '12345');

  range.setStart(textNode, 1);
  range.setEnd(textNode, 4);
  t.equal(range.text(), '234');
});

if (!textNodeSpacesCollapsed) {
  QUnit.test('range text() on simple text with double space', function (t) {
    el.innerHTML = '12  34';
    var textNode = el.firstChild;
    var range = rangy.createRange();
    range.setStart(textNode, 1);
    range.setEnd(textNode, 5);
    t.equal(range.text(), '2 3');
  });
}

QUnit.test('range move() on block inside block (issue 114)', function (t) {
  el.innerHTML = '<div>x<div>y</div></div>';
  var firstTextNode = el.firstChild.firstChild;
  var innerDiv = firstTextNode.nextSibling;
  var secondTextNode = innerDiv.firstChild;
  var range = rangy.createRange();
  range.collapseToPoint(firstTextNode, 1);
  range.move('character', 1);

  t.equal(range.startContainer, secondTextNode);
  t.equal(range.startOffset, 0);

  var newRange = range.cloneRange();
  newRange.move('character', 1);

  t.equal(newRange.startContainer, secondTextNode);
  t.equal(newRange.startOffset, 1);
});

QUnit.test(
  'range move() on block inside block inside block (issue 114)',
  function (t) {
    el.innerHTML = '<div>x<div><div>y</div></div></div>';
    var firstTextNode = el.firstChild.firstChild;
    var innerDiv = firstTextNode.nextSibling;
    var secondTextNode = innerDiv.firstChild.firstChild;
    var range = rangy.createRange();
    range.collapseToPoint(firstTextNode, 1);
    range.move('character', 1);
    var newRange = range.cloneRange();
    newRange.move('character', 1);

    t.equal(range.startContainer, secondTextNode);
    t.equal(range.startOffset, 0);
  }
);

QUnit.test('range move() on br inside block', function (t) {
  el.innerHTML = '<div>x<div><br></div></div>';
  var firstTextNode = el.firstChild.firstChild;
  var range = rangy.createRange();
  range.collapseToPoint(firstTextNode, 0);
  range.move('character', 2);

  t.deepEqual(range.startContainer, el);
  t.equal(range.startOffset, 1);
});

QUnit.test('range move() on br inside block 2', function (t) {
  el.innerHTML = '<div>x<div><br></div>y</div>';
  var firstTextNode = el.firstChild.firstChild;
  var range = rangy.createRange();
  range.collapseToPoint(firstTextNode, 0);
  range.move('character', 2);

  t.equal(range.startContainer, el.firstChild.lastChild);
  t.equal(range.startOffset, 0);
});

function visibleSpaces(str) {
  return str
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\s/g, (m: string): string => {
      return '[' + m.charCodeAt(0) + ']';
    });
}

QUnit.test('innerText on br inside block 1', function (t) {
  el.innerHTML = '<div><br></div>';
  t.equal(visibleSpaces(textRange.innerText(el)), '\\n');
});

QUnit.test('innerText on br inside block 2', function (t) {
  el.innerHTML = '<div>x<div><br></div></div>';
  t.equal(visibleSpaces(textRange.innerText(el)), 'x\\n');
});

QUnit.test('innerText on br inside block 3', function (t) {
  el.innerHTML = '<div>x<div><br></div>y</div>z';
  t.equal(visibleSpaces(textRange.innerText(el)), 'x\\ny\\nz');
});

QUnit.test('innerText on br inside block 4', function (t) {
  el.innerHTML = '<div>x<div><br></div>y</div>z';
  t.equal(visibleSpaces(textRange.innerText(el)), 'x\\ny\\nz');
});

QUnit.test('innerText on br inside block 5', function (t) {
  el.innerHTML = 'x<div><br></div><div><br></div>';
  t.equal(visibleSpaces(textRange.innerText(el)), 'x\\n\\n');
});

QUnit.test('innerText on br inside block 6', function (t) {
  el.innerHTML = '<div><div><br></div></div>';
  t.equal(visibleSpaces(textRange.innerText(el)), '\\n');
});

QUnit.test('selectCharacters on text node', function (t) {
  el.innerHTML = 'One Two';
  var range = rangy.createRange();
  var textNode = el.firstChild;

  range.selectCharacters(el, 2, 5);
  testRangeBoundaries(t, range, textNode, 2, textNode, 5);
  t.equal(range.text(), 'e T');
});

if (!textNodeSpacesCollapsed) {
  QUnit.test('selectCharacters on text node with double space', function (t) {
    el.innerHTML = 'One  Two';
    var range = rangy.createRange();
    var textNode = el.firstChild;

    range.selectCharacters(el, 2, 5);
    testRangeBoundaries(t, range, textNode, 2, textNode, 6);
    t.equal(range.text(), 'e T');
  });
}

if (!textNodeSpacesCollapsed) {
  QUnit.test(
    'toCharacterRange in text node with collapsed spaces',
    function (t) {
      el.innerHTML = ' One  Two';
      var range = rangy.createRange();
      var textNode = el.firstChild;

      range.setStart(textNode, 3);
      range.setEnd(textNode, 7);

      var charRange = range.toCharacterRange(el);
      t.equal(charRange.start, 2);
      t.equal(charRange.end, 5);
    }
  );
}

QUnit.test('moveStart on text node', function (t) {
  el.innerHTML = 'One Two';
  var range = rangy.createRange();
  range.selectNodeContents(el);

  var charsMoved = range.moveStart('character', 2);
  t.equal(charsMoved, 2);
  t.equal(range.startContainer, el.firstChild);
  t.equal(range.startOffset, 2);
  t.equal(range.text(), 'e Two');

  charsMoved = range.moveStart('character', 2);
  t.equal(charsMoved, 2);
  t.equal(range.startContainer, el.firstChild);
  t.equal(range.startOffset, 4);
  t.equal(range.text(), 'Two');
});

// XXX: skipping: always specify a unit
// QUnit.test('moveStart with no unit on text node', function (t) {
//   el.innerHTML = 'One Two';
//   var range = rangy.createRange();
//   range.selectNodeContents(el);

//   var charsMoved = range.moveStart(2);
//   t.equal(charsMoved, 2);
//   t.equal(range.startContainer, el.firstChild);
//   t.equal(range.startOffset, 2);
//   t.equal(range.text(), 'e Two');

//   charsMoved = range.moveStart(2);
//   t.equal(charsMoved, 2);
//   t.equal(range.startContainer, el.firstChild);
//   t.equal(range.startOffset, 4);
//   t.equal(range.text(), 'Two');
// });

QUnit.test('moveStart on text node, negative move', function (t) {
  el.innerHTML = 'One Two';
  var range = rangy.createRange();
  var textNode = el.firstChild;
  range.collapseToPoint(textNode, 7);

  var charsMoved = range.moveStart('character', -2);
  t.equal(range.startContainer, textNode);
  t.equal(range.startOffset, 5);
  t.equal(charsMoved, -2);
  t.equal(range.text(), 'wo');

  charsMoved = range.moveStart('character', -2);
  t.equal(range.startContainer, textNode);
  t.equal(range.startOffset, 3);
  t.equal(charsMoved, -2);
  t.equal(range.text(), ' Two');
});

QUnit.test('moveEnd on text node', function (t) {
  el.innerHTML = 'One Two';
  var range = rangy.createRange();
  var textNode = el.firstChild;
  range.selectNodeContents(textNode);

  var charsMoved = range.moveEnd('character', -2);
  t.equal(charsMoved, -2);
  testRangeBoundaries(t, range, textNode, 0, textNode, 5);
  t.equal(range.text(), 'One T');

  charsMoved = range.moveEnd('character', -2);
  t.equal(charsMoved, -2);
  testRangeBoundaries(t, range, textNode, 0, textNode, 3);
  t.equal(range.text(), 'One');
});

// XXX: skipping: always specify a unit
// QUnit.test('moveEnd with no unit on text node', function (t) {
//   el.innerHTML = 'One Two';
//   var range = rangy.createRange();
//   var textNode = el.firstChild;
//   range.selectNodeContents(textNode);

//   var charsMoved = range.moveEnd(-2);
//   t.equal(charsMoved, -2);
//   testRangeBoundaries(t, range, textNode, 0, textNode, 5);
//   t.equal(range.text(), 'One T');

//   charsMoved = range.moveEnd(-2);
//   t.equal(charsMoved, -2);
//   testRangeBoundaries(t, range, textNode, 0, textNode, 3);
//   t.equal(range.text(), 'One');
// });

QUnit.test('moveStart, moveEnd words on text node', function (t) {
  el.innerHTML = 'one two three';
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.setStart(textNode, 5);
  range.setEnd(textNode, 6);

  var wordsMoved = range.moveStart('word', -1);
  t.equal(wordsMoved, -1);
  testRangeBoundaries(t, range, textNode, 4, textNode, 6);
  t.equal(range.text(), 'tw');

  wordsMoved = range.moveEnd('word', 1);
  t.equal(wordsMoved, 1);
  testRangeBoundaries(t, range, textNode, 4, textNode, 7);
  t.equal(range.text(), 'two');
});

QUnit.test('moveStart words with apostrophe on text node', function (t) {
  el.innerHTML = "one don't two";
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.setStart(textNode, 5);
  range.setEnd(textNode, 9);

  var wordsMoved = range.moveStart('word', -1);
  t.equal(wordsMoved, -1);
  testRangeBoundaries(t, range, textNode, 4, textNode, 9);
  t.equal(range.text(), "don't");

  wordsMoved = range.moveEnd('word', 1);
  t.equal(wordsMoved, 1);
  testRangeBoundaries(t, range, textNode, 4, textNode, 13);
  t.equal(range.text(), "don't two");
});

QUnit.test('moveStart words on text node', function (t) {
  el.innerHTML = 'one two three';
  var textNode = el.firstChild;

  textRange.noMutation(function () {
    var range = rangy.createRange();
    range.collapseToPoint(textNode, 1);

    var wordsMoved = range.moveStart('word', 1);

    t.equal(wordsMoved, 1);
    t.equal(range.startContainer, textNode);
    t.equal(range.startOffset, 3);
    t.ok(range.collapsed);
    //t.equal(range.text(), "");

    wordsMoved = range.moveStart('word', 1);
    t.equal(wordsMoved, 1);
    t.equal(range.startContainer, textNode);
    t.equal(range.startOffset, 7);
    //t.equal(range.text(), "");

    wordsMoved = range.moveStart('word', 1);
    t.equal(wordsMoved, 1);
    t.equal(range.startContainer, textNode);
    t.equal(range.startOffset, 13);
    //t.equal(range.text(), "");
  });
});

QUnit.test('moveEnd negative words on text node', function (t) {
  el.innerHTML = 'one two three';
  var textNode = el.firstChild;
  textRange.noMutation(function () {
    var range = rangy.createRange();
    range.collapseToPoint(textNode, 9);

    var wordsMoved = range.moveEnd('word', -1);

    t.equal(wordsMoved, -1);
    t.equal(range.startContainer, textNode);
    t.equal(range.startOffset, 8);
    t.equal(range.endOffset, 8);
    t.ok(range.collapsed);

    wordsMoved = range.moveEnd('word', -1);
    t.equal(wordsMoved, -1);
    t.equal(range.startContainer, textNode);
    t.equal(range.startOffset, 4);
    //t.equal(range.text(), "");

    wordsMoved = range.moveEnd('word', -1);
    t.equal(wordsMoved, -1);
    t.equal(range.startContainer, textNode);
    t.equal(range.startOffset, 0);
  });
  //t.equal(range.text(), "");
});

QUnit.test('moveStart two words on text node', function (t) {
  el.innerHTML = 'one two three';
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.collapseToPoint(textNode, 1);

  var wordsMoved = range.moveStart('word', 2);
  t.equal(wordsMoved, 2);
  testCollapsedRangeBoundaries(t, range, textNode, 7);
  t.equal(range.text(), '');
});

QUnit.test('moveEnd including trailing space on text node', function (t) {
  el.innerHTML = 'one two. three';
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.collapseToPoint(textNode, 0);

  var wordsMoved = range.moveEnd('word', 1, {
    wordOptions: { includeTrailingSpace: true },
  });
  t.equal(wordsMoved, 1);
  t.equal(range.endContainer, textNode);
  t.equal(range.endOffset, 4);
  t.equal(range.text(), 'one ');

  wordsMoved = range.moveEnd('word', 1, {
    wordOptions: { includeTrailingSpace: true },
  });
  t.equal(wordsMoved, 1);
  t.equal(range.endContainer, textNode);
  t.equal(range.endOffset, 7);
  t.equal(range.text(), 'one two');

  wordsMoved = range.moveEnd('word', 1, {
    wordOptions: { includeTrailingSpace: true },
  });
  t.equal(wordsMoved, 1);
  t.equal(range.endContainer, textNode);
  t.equal(range.endOffset, 14);
  t.equal(range.text(), 'one two. three');
});

/*
   QUnit.test("moveEnd including trailing punctuation on text node", function(t) {
   el.innerHTML = 'one!! two!! three!! four!!';
   var textNode = el.firstChild;
   var range = rangy.createRange();
   range.collapseToPoint(textNode, 0);

   var wordsMoved = range.moveEnd("word", 1, { includeTrailingPunctuation: true });
   t.equal(wordsMoved, 1);
   t.equal(range.endContainer, textNode);
   t.equal(range.endOffset, 5);
   t.equal(range.text(), "one!!");

   wordsMoved = range.moveEnd("word", 1, { includeTrailingPunctuation: true, includeTrailingSpace: true });
   t.equal(wordsMoved, 1);
   t.equal(range.endContainer, textNode);
   t.equal(range.endOffset, 12);
   t.equal(range.text(), "one!! two!! ");

   wordsMoved = range.moveEnd("word", 1, { includeTrailingSpace: true });
   t.equal(wordsMoved, 1);
   t.equal(range.endContainer, textNode);
   t.equal(range.endOffset, 17);
   t.equal(range.text(), "one!! two!! three");

   wordsMoved = range.moveEnd("word", 1, { includeTrailingPunctuation: true });
   t.equal(wordsMoved, 1);
   t.equal(range.endContainer, textNode);
   t.equal(range.endOffset, 26);
   t.equal(range.text(), "one!! two!! three!! four!!");
   });
   */

QUnit.test('moveStart characters with br', function (t) {
  el.innerHTML = '1<br>2';
  var textNode1 = el.firstChild,
    textNode2 = el.lastChild;
  var range = rangy.createRange();
  range.collapseToPoint(textNode1, 0);

  var charsMoved = range.moveStart('character', 1);
  t.equal(charsMoved, 1);
  testCollapsedRangeBoundaries(t, range, textNode1, 1);

  charsMoved = range.moveStart('character', 1);
  t.equal(charsMoved, 1);
  testCollapsedRangeBoundaries(t, range, el, 2);

  charsMoved = range.moveStart('character', 1);
  testCollapsedRangeBoundaries(t, range, textNode2, 1);
});

QUnit.test('expand in text node', function (t) {
  el.innerHTML = 'One two three';
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.setStart(textNode, 5);
  range.setEnd(textNode, 6);

  t.ok(range.expand('word'));
  testRangeBoundaries(t, range, textNode, 4, textNode, 7);
});

QUnit.test('expand in text node, include trailing space', function (t) {
  el.innerHTML = 'One two three';
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.collapseToPoint(textNode, 5);

  t.ok(range.expand('word', { wordOptions: { includeTrailingSpace: true } }));
  testRangeBoundaries(t, range, textNode, 4, textNode, 8);
});

QUnit.test('expand in text node, start of word', function (t) {
  el.innerHTML = 'One two three';
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.collapseToPoint(textNode, 4);

  t.ok(range.expand('word'));
  testRangeBoundaries(t, range, textNode, 4, textNode, 7);
});

QUnit.test('expand in text node, mid-capitalized word', function (t) {
  el.innerHTML = 'One Two three';
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.collapseToPoint(textNode, 5);

  t.ok(range.expand('word'));
  testRangeBoundaries(t, range, textNode, 4, textNode, 7);
});

QUnit.test('expand in text node, around word', function (t) {
  el.innerHTML = 'One two three';
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.setStart(textNode, 4);
  range.setEnd(textNode, 7);

  t.assertFalse(range.expand('word'));
  testRangeBoundaries(t, range, textNode, 4, textNode, 7);
});

QUnit.test('expand in text node, non-move test return value', function (t) {
  el.innerHTML = 'One Two three';
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.setStart(textNode, 4);
  range.setEnd(textNode, 7);

  t.assertFalse(range.expand('word'));
  testRangeBoundaries(t, range, textNode, 4, textNode, 7);
});

QUnit.test('findText simple text', function (t) {
  el.innerHTML = 'One Two three';
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.collapseToPoint(textNode, 0);

  var scopeRange = rangy.createRange();
  scopeRange.selectNodeContents(el);
  var options = {
    withinRange: scopeRange,
  };

  t.ok(range.findText('Two', options));
  testRangeBoundaries(t, range, textNode, 4, textNode, 7);
  range.collapse(false);
  t.assertFalse(range.findText('Two', options));
});

QUnit.test('findText simple text no wrap', function (t) {
  el.innerHTML = 'Two One Two three';
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.collapseToPoint(textNode, 3);

  var scopeRange = rangy.createRange();
  scopeRange.selectNodeContents(el);
  var options = {
    withinRange: scopeRange,
  };

  t.ok(range.findText('Two', options));
  testRangeBoundaries(t, range, textNode, 8, textNode, 11);
  range.collapse(false);
  t.assertFalse(range.findText('Two', options));
});

QUnit.test('findText simple text wrap', function (t) {
  el.innerHTML = 'Two One Two three';
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.collapseToPoint(textNode, 3);

  var scopeRange = rangy.createRange();
  scopeRange.selectNodeContents(el);
  var options = {
    withinRange: scopeRange,
    wrap: true,
  };

  t.ok(range.findText('Two', options));
  testRangeBoundaries(t, range, textNode, 8, textNode, 11);
  range.collapse(false);

  t.ok(range.findText('Two', options));
  testRangeBoundaries(t, range, textNode, 0, textNode, 3);
  range.collapse(false);
});

QUnit.test('findText simple text wrap mid-word', function (t) {
  el.innerHTML = 'Two One Two three';
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.collapseToPoint(textNode, 9);

  var scopeRange = rangy.createRange();
  scopeRange.selectNodeContents(el);
  var options = {
    withinRange: scopeRange,
    wrap: true,
  };

  t.ok(range.findText('Two', options));
  testRangeBoundaries(t, range, textNode, 0, textNode, 3);
  range.collapse(false);

  t.ok(range.findText('Two', options));
  testRangeBoundaries(t, range, textNode, 8, textNode, 11);
  range.collapse(false);
});

QUnit.test('findText regex', function (t) {
  el.innerHTML = 'One Two three';
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.collapseToPoint(textNode, 0);

  var scopeRange = rangy.createRange();
  scopeRange.selectNodeContents(el);
  var options = {
    withinRange: scopeRange,
  };

  t.ok(range.findText(/\w+/, options));
  testRangeBoundaries(t, range, textNode, 0, textNode, 3);
  range.collapse(false);

  t.ok(range.findText(/\w+/, options));
  testRangeBoundaries(t, range, textNode, 4, textNode, 7);
  range.collapse(false);

  t.ok(range.findText(/\w+/, options));
  testRangeBoundaries(t, range, textNode, 8, textNode, 13);
  range.collapse(false);

  t.assertFalse(range.findText(/\w+/, options));
});

QUnit.test('findText simple text backwards', function (t) {
  el.innerHTML = 'One Two three Two';
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.collapseToPoint(textNode, 8);

  var scopeRange = rangy.createRange();
  scopeRange.selectNodeContents(el);
  var options: Partial<FindOptions> = {
    withinRange: scopeRange,
    direction: 'backward',
  };

  t.ok(range.findText('Two', options));
  testRangeBoundaries(t, range, textNode, 4, textNode, 7);
  range.collapse(true);

  t.assertFalse(range.findText('Two', options));
});

QUnit.test('findText simple text backwards wrapped', function (t) {
  el.innerHTML = 'One Two three Two';
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.collapseToPoint(textNode, 8);

  var scopeRange = rangy.createRange();
  scopeRange.selectNodeContents(el);
  var options: Partial<FindOptions> = {
    withinRange: scopeRange,
    direction: 'backward',
    wrap: true,
  };

  t.ok(range.findText('Two', options));
  testRangeBoundaries(t, range, textNode, 4, textNode, 7);
  range.collapse(true);

  t.ok(range.findText('Two', options));
  testRangeBoundaries(t, range, textNode, 14, textNode, 17);
});

QUnit.test('findText regex at end of scope', function (t) {
  el.innerHTML = 'One Two three';
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.collapseToPoint(textNode, 0);

  var scopeRange = rangy.createRange();
  scopeRange.selectNodeContents(el);
  var options = {
    withinRange: scopeRange,
  };

  t.ok(range.findText(/three/, options));
  testRangeBoundaries(t, range, textNode, 8, textNode, 13);
});

QUnit.test('createWordIterator', function (t) {
  el.innerHTML = 'One two three; four';

  textRange.noMutation(function () {
    var iterator = textRange.createWordIterator(el.firstChild, 10);

    t.equal(iterator.next().toString(), 'three');
    t.equal(iterator.next().toString(), '; ');
    t.equal(iterator.next().toString(), 'four');
    iterator.dispose();

    iterator = textRange.createWordIterator(el.firstChild, 10, {
      direction: 'backward',
    });

    t.equal(iterator.next().toString(), 'three');
    t.equal(iterator.next().toString(), ' ');
    t.equal(iterator.next().toString(), 'two');
    t.equal(iterator.next().toString(), ' ');
    t.equal(iterator.next().toString(), 'One');
  });
});

QUnit.test('moveStart word document start boundary test', function (t) {
  var range = rangy.createRange();
  range.collapseBefore(document.body);

  while (range.moveStart('word', -1)) {}

  t.expect(0);
});

QUnit.test('moveEnd word document end boundary test', function (t) {
  var range = rangy.createRange();
  range.collapseAfter(document.body);

  while (range.moveStart('word', 1)) {}

  t.expect(0);
});

QUnit.test('trimStart test', function (t) {
  el.innerHTML = 'One two three';
  var textNode = el.firstChild;
  var range = rangy.createRange() as rangy.WrappedRange;
  range.setStartAndEnd(textNode, 3, 8);
  range.trimStart();
  t.equal(range.startOffset, 4, 'range.startOffset');
  t.equal(range.endOffset, 8, 'range.endOffset');
  range.trimStart();
  t.equal(range.startOffset, 4, 'range.startOffset, repeated');
  t.equal(range.endOffset, 8, 'range.endOffset, repeated');

  el.innerHTML = 'One&nbsp;&nbsp;two three';
  range.selectCharacters(el, 3, 8);
  t.equal(range.text(), '\u00a0\u00a0two');

  var charRange = range.toCharacterRange(el.parentElement);

  range.trimStart();
  t.equal(range.text(), 'two', 'trims &nbsp;');

  var trimmedCharRange = range.toCharacterRange(container);
  t.equal(charRange.start, 3, 'charRange.start');
  t.equal(charRange.end, 8, 'charRange.end');
  t.equal(trimmedCharRange.start, 5, 'trimmedCharRange.start');
  t.equal(trimmedCharRange.end, 8, 'trimmedCharRange.start');
});

QUnit.test('trimEnd test', function (t) {
  el.innerHTML = 'One two three';
  var textNode = el.firstChild;
  var range = rangy.createRange();
  range.setStartAndEnd(textNode, 3, 8);
  range.trimEnd();
  t.equal(range.startOffset, 3);
  t.equal(range.endOffset, 7);
  range.trimEnd();
  t.equal(range.startOffset, 3);
  t.equal(range.endOffset, 7);

  el.innerHTML = 'One two&nbsp;&nbsp;three';
  range.selectCharacters(el, 4, 9);
  t.equal(range.text(), 'two\u00a0\u00a0');

  var charRange = range.toCharacterRange(container);

  range.trimEnd();
  t.equal(range.text(), 'two');

  var trimmedCharRange = range.toCharacterRange(container);
  t.equal(charRange.start, 4);
  t.equal(charRange.end, 9);
  t.equal(trimmedCharRange.start, 4);
  t.equal(trimmedCharRange.end, 7);
});

/*
  QUnit.test("Speed test", function(t) {
      //el.innerHTML = new Array(10000).join("<p>One <b>two <i>three</i></b> four<br> </p>\n<p>four </p>");
      var range = rangy.createRange();
      var text = range.text();
  });
*/

QUnit.test(
  'innerText with two paragraphs, leading space, trailing space, intervening space',
  function (t) {
    el.innerHTML = '<p>x </p> <p> y</p>';
    t.equal(
      textRange.innerText(el, { includeBlockContentTrailingSpace: false }),
      'x\ny'
    );
    t.equal(
      textRange.innerText(el, { includeBlockContentTrailingSpace: true }),
      'x \ny'
    );
  }
);

QUnit.test(
  'Range move with two paragraphs, leading space, trailing space, intervening space, includeBlockContentTrailingSpace false',
  function (t) {
    el.innerHTML = '<p>x </p> <p> y</p>';
    var textNode = el.firstChild.firstChild;
    var secondParaTextNode = el.lastChild.firstChild;
    var range = rangy.createRange();
    range.collapseToPoint(textNode, 1);

    range.move('character', 1, {
      characterOptions: { includeBlockContentTrailingSpace: false },
    });
    testRangeBoundaries(t, range, el, 1, el, 1);

    range.move('character', 1, {
      characterOptions: { includeBlockContentTrailingSpace: false },
    });
    testRangeBoundaries(t, range, secondParaTextNode, 2, secondParaTextNode, 2);
  }
);

QUnit.test(
  'Range move with two paragraphs, leading space, trailing space, intervening space, includeBlockContentTrailingSpace true',
  function (t) {
    el.innerHTML = '<p>x </p> <p> y</p>';
    var textNode = el.firstChild.firstChild;
    var secondParaTextNode = el.lastChild.firstChild;
    var range = rangy.createRange();
    range.collapseToPoint(textNode, 1);

    range.move('character', 1, {
      characterOptions: { includeBlockContentTrailingSpace: true },
    });
    testRangeBoundaries(t, range, textNode, 2, textNode, 2);

    range.move('character', 1, {
      characterOptions: { includeBlockContentTrailingSpace: true },
    });
    testRangeBoundaries(t, range, el, 1, el, 1);

    range.move('character', 1, {
      characterOptions: { includeBlockContentTrailingSpace: false },
    });
    testRangeBoundaries(t, range, secondParaTextNode, 2, secondParaTextNode, 2);
  }
);

QUnit.test('Selection move test', function (t) {
  el.innerHTML = '<p>x </p> <p> y</p>';
  var textNode = el.firstChild.firstChild;
  var secondParaTextNode = el.lastChild.firstChild;
  var sel = rangy.getSelection();

  sel.collapse(textNode, 2);
  sel.move('character', 1);
  var range = sel.getRangeAt(0) as rangy.WrappedRange;

  t.ok(
    (range.startContainer == el ||
      range.startContainer == secondParaTextNode) &&
      range.startOffset == 1
  );
  //testRangeBoundaries(t, range, el, 1, el, 1);

  sel.move('character', 1);
  range = sel.getRangeAt(0) as rangy.WrappedRange;
  testRangeBoundaries(t, range, secondParaTextNode, 2, secondParaTextNode, 2);
});

QUnit.test('toCharacterRange test (issue 286)', function (t) {
  el.innerHTML =
    '<pre class="code-block lang-javascript ng-scope"><span class="hljs-keyword">for</span> (<span class="hljs-keyword">var</span> i=<span class="hljs-number">0</span>; i &lt;<span class="hljs-number">10</span>; i++) {  <span class="hljs-built_in">console</span>.log (i); }</pre>';
  var textNode = el.firstChild.lastChild as Text;
  var range = rangy.createRange();
  range.setStartAndEnd(el.firstChild, 0, textNode, textNode.length);
  var charRange = range.toCharacterRange(el.firstChild);

  t.equal(charRange.start, 0);
  t.equal(charRange.end, 47);
});

QUnit.test('<div><br></div><div>x</div> test (issue 164 part 1)', function (t) {
  console.log('before?', { el, parent: el.parentElement, container });
  el.innerHTML = '<div id="x">xyz</div>';
  console.log('after?', { el, parent: el.parentElement, container });
  var div = el.lastChild;
  var range = rangy.createRange();
  range.setStartAndEnd(div, 0);
  t.equal(range.startOffset, 0, 'range.startOffset');
  t.equal(range.endOffset, 0, 'range.endOffset');
  t.equal((el as HTMLElement).innerText, 'xyz', '.innerText');
  var charRange = range.toCharacterRange(el);
  console.log({ div, range, charRange });
  t.equal(charRange.start, 1, 'charRange.start');
  t.equal(charRange.end, 3, 'charRange.end');
});

QUnit.test(
  '<div><br></div><div><br></div><div><br></div> test (issue 164 part 2)',
  function (t) {
    el.innerHTML = '<div><br></div><div><br></div><div><br></div>';
    var div = el.lastChild;
    var range = rangy.createRange();
    range.setStartAndEnd(el.childNodes[2], 0);
    var charRange = range.toCharacterRange(el);
    t.equal(charRange.start, 2);
    t.equal(charRange.end, 2);

    range.selectCharacters(el, 1, 1);
    var charRange = range.toCharacterRange(el);
    t.equal(charRange.start, 1);
    t.equal(charRange.end, 1);

    range.selectCharacters(el, 2, 2);
    charRange = range.toCharacterRange(el);
    t.equal(charRange.start, 2);
    t.equal(charRange.end, 2);
  }
);

QUnit.test('Issue 304', function (t) {
  /*
      el.innerHTML = "<span>1  2";
      t.equal(visibleSpaces(textRange.innerText(el)), visibleSpaces("1 2") );
*/

  el.innerHTML = '<span>X</span> <span> Y</span>';
  t.equal(visibleSpaces(textRange.innerText(el)), visibleSpaces('X Y'));

  /*
      el.innerHTML = ["<span>female</span>",
          "    <span> presents to the ED with a Chief Complaint of </span>",
          "    <span>Shoulder Pain</span>"].join("\n");

      t.equal(visibleSpaces(textRange.innerText(el)),  visibleSpaces("female presents to the ED with a Chief Complaint of Shoulder Pain") );
*/
});

QUnit.test('Paragraphs test (issue 128)', function (t) {
  el.innerHTML = '\n  <p>a</p>\n  <p>a</p>\n';
  var p = el.getElementsByTagName('p')[1];
  var range = rangy.createRange();
  range.setStartAndEnd(p.firstChild, 0, 1);
  var charRange = range.toCharacterRange(el);
  t.equal(charRange.start, 2);
  t.equal(charRange.end, 3);

  var sel = rangy.getSelection();
  sel.selectAllChildren(p);
  charRange = (sel.getRangeAt(0) as rangy.WrappedRange).toCharacterRange(el);
  t.equal(charRange.start, 2);
  t.equal(charRange.end, 3);
});

QUnit.test('Word iterator test (issue 130)', function (t) {
  el.innerHTML = 'Hello . . Goodbye';
  var it = textRange.createWordIterator(el, 0);
  var word,
    words = [];
  while ((word = it.next())) {
    if (!rangy.dom.isOrIsAncestorOf(el, word.chars[0].node)) {
      break;
    }
    if (word.isWord) {
      words.push(word.toString());
    }
  }
  t.deepEqual(words, ['Hello', 'Goodbye']);
});
