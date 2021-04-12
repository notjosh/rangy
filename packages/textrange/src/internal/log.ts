const noop = (...args) => {};

const log = {
  debug: noop /*console.log*/,
  info: noop /*console.log*/,
  group: noop,
  groupEnd: noop,
};

export default log;
