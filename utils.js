function cleanup(callback) {

  // attach user callback to the process event emitter
  // if no callback, it will still exit gracefully on Ctrl-C
  callback = callback || noop;

  // do app specific cleaning before exiting
  process.on('exit', function () {
    callback();
  });

  // catch ctrl+c event and exit normally
  process.on('SIGINT', function () {
    callback();
    process.exit();
  });

  //catch uncaught exceptions, trace, then exit normally
  process.on('uncaughtException', function(e) {
    console.error(e);
    callback();
    process.exit();
  });
};

module.exports = {
  cleanup
}