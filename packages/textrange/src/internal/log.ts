const noop = (...args) => {};

const log = {
  debug: console.log,
  info: console.log,
  group: noop,
  groupEnd: noop,
};

export default log;
