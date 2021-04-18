const noop = (...args) => {};

const log = {
  debug: console.log,
  info: console.log,
  group: console.log,
  groupEnd: console.log,
};

export default log;
