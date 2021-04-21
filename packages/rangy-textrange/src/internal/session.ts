import { RangeBase, util } from '@notjosh/rangy-core';
import NodeWrapper from './nodewrapper';
import Position from './position';
import ValueCache from './valuecache';

function createWrapperCache(nodeProperty: string) {
  var cache = new ValueCache();

  return {
    get: (node: Node): any => {
      var wrappersByProperty = cache.get(node[nodeProperty]);
      if (wrappersByProperty) {
        for (
          let i = 0, wrapper: NodeWrapper;
          (wrapper = wrappersByProperty[i++]);

        ) {
          if (wrapper.node === node) {
            return wrapper;
          }
        }
      }
      return null;
    },

    set: (nodeWrapper: NodeWrapper) => {
      const property = nodeWrapper.node[nodeProperty];
      const wrappersByProperty = cache.get(property) ?? cache.set(property, []);
      wrappersByProperty.push(nodeWrapper);
    },
  };
}

type WrapperCache = ReturnType<typeof createWrapperCache>;

class Session {
  static uniqueIDSupported = util.isHostProperty(
    document.documentElement,
    'uniqueID'
  );

  private elementCache: WrapperCache = Session.uniqueIDSupported
    ? (function () {
        const elementsCache = new ValueCache();

        return {
          get: function (el: Element) {
            return elementsCache.get((el as any).uniqueID);
          },

          set: function (elWrapper: NodeWrapper) {
            elementsCache.set((elWrapper.node as any).uniqueID, elWrapper);
          },
        };
      })()
    : createWrapperCache('tagName');

  // Store text nodes keyed by data, although we may need to truncate this
  private textNodeCache: WrapperCache = createWrapperCache('data');
  private otherNodeCache: WrapperCache = createWrapperCache('nodeName');

  getNodeWrapper(node: Node): NodeWrapper {
    let wrapperCache: WrapperCache;
    switch (node.nodeType) {
      case Node.ELEMENT_NODE:
        wrapperCache = this.elementCache;
        break;
      case Node.TEXT_NODE:
        wrapperCache = this.textNodeCache;
        break;
      default:
        wrapperCache = this.otherNodeCache;
        break;
    }

    var wrapper = wrapperCache.get(node);
    if (!wrapper) {
      wrapper = new NodeWrapper(node, this);
      wrapperCache.set(wrapper);
    }
    return wrapper;
  }

  getPosition(node: Node, offset: number): Position {
    return this.getNodeWrapper(node).getPosition(offset);
  }

  getRangeBoundaryPosition(range: RangeBase, isStart: boolean): Position {
    var prefix = isStart ? 'start' : 'end';
    return this.getPosition(
      range[prefix + 'Container'],
      range[prefix + 'Offset']
    );
  }

  detach() {
    this.elementCache = this.textNodeCache = this.otherNodeCache = null;
  }
}

let currentSession: Session | null = null;

export function createEntryPointFunction(func: Function) {
  return function () {
    var sessionRunning = !!currentSession;
    var session = getSession();
    var args = [session].concat(Array.from(arguments));
    var returnValue = func.apply(this, args);
    if (!sessionRunning) {
      endSession();
    }
    return returnValue;
  };
}

function startSession() {
  endSession();
  return (currentSession = new Session());
}

export function getSession() {
  return currentSession || startSession();
}

export function endSession() {
  if (currentSession) {
    currentSession.detach();
  }
  currentSession = null;
}

export default Session;
