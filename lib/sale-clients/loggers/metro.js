
'use strict';

var winston = require('winston'),
    config = require('../../../config/'),
    labelId = 'METRO',
    logger;

var isProduction = config.get('NODE_ENV') === 'production' ? true : false;

/**
 * Configure the primary logger, to see the default levels that winston
 * support call `logger.levels` or `winston.levels`.
 *
 * When a transport is setup with a level, means that it will use
 * for that level and levels below it, to see the default order for levels
 * call `logger.levels` or `winston.levels`.
 */
logger = new winston.Logger({
    transports : [
        new winston.transports.Console({
            level: 'debug',
            silent: isProduction,
            colorize: true,
            label: labelId
        }),
        new winston.transports.File({
            level: 'info',
            silent: !isProduction,
            colorize: false,
            timestamp: true,
            filename: config.get('metro:logger:info'),
            maxsize: 5242880, //5MB
            maxFiles: 5,
            label: labelId
        }),
        new winston.transports.File({
            // Set name to make the transport type unique
            // allowing setup more than one transport type in a logger instance
            // see https://github.com/flatiron/winston/issues/101#issuecomment-28568947
            name: 'file.error',
            level: 'error',
            silent: !isProduction,
            colorize: false,
            timestamp: true,
            filename: config.get('metro:logger:error'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            label: labelId
        }),
    ]
});

/**
 * Just throw error on winston fail, when env is not production
 */
if (isProduction) {
    logger.emitErrs = false;
} else {
    logger.emitErrs = true;
}

module.exports = logger;

