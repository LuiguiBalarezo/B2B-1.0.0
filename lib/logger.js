'use strict';

var winston = require('winston'),
    Mail = require('winston-mail').Mail,
    config = require('../config/'),
    emailConf = config.get('email'),
    logger;

var isProduction = config.get('NODE_ENV') === 'production' ? true : false;

var customLevels = {
  levels: {
    debug: 1,
    info: 3,
    successNotification: 4,
    error: 5,
    errorNotification: 6
  }
};

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
      colorize: true
    }),
    new winston.transports.File({
      level: 'info',
      silent: !isProduction,
      colorize: false,
      timestamp: true,
      filename: config.get('logger:info'),
      maxsize: 5242880, //5MB
      maxFiles: 5
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
      filename: config.get('logger:error'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  levels: customLevels.levels
});

/**
 * Configure mail transport
 */
logger.add(Mail, {
  host: emailConf.host,
  port: emailConf.port,
  ssl: emailConf.ssl,
  tls: emailConf.tls,
  username: emailConf.username,
  password: emailConf.password,
  subject: 'Archivo de ventas procesado con exito (enviado desde Bot)',
  from: emailConf.from,
  to: emailConf.to,
  level: 'successNotification',
  silent: !isProduction
});

logger.add(Mail, {
  name: 'email.error',
  host: emailConf.host,
  port: emailConf.port,
  ssl: emailConf.ssl,
  tls: emailConf.tls,
  username: emailConf.username,
  password: emailConf.password,
  subject: 'Error procesando carga de ventas (enviado desde Bot)',
  from: emailConf.from,
  to: emailConf.to,
  level: 'errorNotification',
  silent: !isProduction,
  handleExceptions: isProduction
});

winston.addColors({
  successNotification: 'green',
  errorNotification: 'red'
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
