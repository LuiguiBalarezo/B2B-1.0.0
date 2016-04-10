'use strict';
//debugger;
module.exports = function() {
  var Promises = require('bluebird'),
      moment = require('moment'),
      logger = require('./lib/logger');

  moment.locale('es');

  Promises.onPossiblyUnhandledRejection(function(err) {
    logger.error(
      'Error catched in unhandled rejection/exception [Promise]: %s\n[STACKTRACE]: %s',
      err.message,
      err.stack
    );

    throw err;
  });
};
