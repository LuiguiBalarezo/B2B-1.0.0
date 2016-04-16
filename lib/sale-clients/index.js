'use strict';
//
var path = require('path'),
    fs = require('fs'),
    chokidar = require('chokidar'),
    later = require('later'),
    logger = require('../logger'),
    dir = __dirname,
    file,
    clientsWork = [];

var MAX_RETRIES = 2;

/**
 * Configure later for time calculations based on local time
 */
later.date.localTime();

/**
 * Load all sale-clients
 */
fs.readdirSync(dir).forEach(function (name) {
    //
    file = path.join(dir, name);
    if (fs.statSync(file).isFile()) {
        if (file !== __filename) {
            logger.info(name + ' client loaded [%s]..', file);

            var moduleExport = require(file);
            clientsWork.push(moduleExport);
        }
    }
});

function getNewSchedule() {
    return later.parse.recur().on('18:55').time();
}

function processClientWork(clientWork, opts, retryCount) {

    var isOneTimeTask = opts.oneTimeTask,
        casperPath = opts.casperPath,
        cwd = opts.cwd,
        fileData = opts.fileData,
        clientProccess,
        clientId;

    if (isOneTimeTask) {
        clientProccess = clientWork(fileData);
    } else {
        if(typeof  clientWork != "function"){

        }
        clientProccess = clientWork(casperPath, cwd);
    }

    clientId = clientProccess.clientId;

    // default value
    retryCount = retryCount || 0;

    logger.info('Procesing [%s] client..', clientId);


    clientProccess.on('finish', function (errMsg, processedFile) {
        var sched;

        if (errMsg) {
            logger.info(errMsg);
        }

        logger.info('Process finished for [%s] client. Everything Ok!', clientId);

        // send email when a task finish ok
        if (!errMsg) {
            logger.successNotification(
                '[%s] ' + (isOneTimeTask ? '(watch directory mode)' : '') +
                ' Sale file (%s) in path: (%s) processed correctly',
                clientId,
                processedFile.name,
                processedFile.path
            );
        }

        if (!isOneTimeTask) {
            sched = getNewSchedule();

            logger.info('Re-scheduling work for [%s] client..', clientId);

            // Re-schedule task
            later.setTimeout(function () {
                processClientWork(clientWork, opts);
            }, sched);
        }
    });

    clientProccess.on('error', function (err) {
        var sched;

        logger.error(
            'A error happened while proccesing [%s] client: %s',
            clientId,
            err.message
        );

        // No-retry when task is one-time, just email error
        if (isOneTimeTask) {
            /**
             * SEND EMAIL, NOTIFY ERROR
             */
            logger.errorNotification(
                'An error happened while procesing [%s] client (watch directory mode)\n' +
                'Please verify the error.\n Error message: %s',
                clientId,
                err.message
            );
            return;
        }

        if (retryCount < MAX_RETRIES) {
            // Try again immediately if MAX_RETIRES is not reached
            retryCount++;

            logger.info(
                'Retrying to process client task [%s].. Attempt Nº %d of %d',
                clientId,
                retryCount,
                MAX_RETRIES
            );

            processClientWork(clientWork, opts, retryCount);

        } else {
            /**
             * SEND EMAIL, NOTIFY ERROR
             */
            logger.errorNotification(
                'An error happened while procesing [%s] client, maximum number of retries ' +
                'is reached: [%d].\nPlease verify the error.\n Error message: %s',
                clientId,
                MAX_RETRIES,
                err.message
            );

            sched = getNewSchedule();

            logger.info(
                'Re-scheduling work for [%s] client after reached maximum retries (%d)..',
                clientId,
                MAX_RETRIES
            );

            // Re-schedule task
            later.setTimeout(function () {

                processClientWork(clientWork, opts);
            }, sched);
        }
    });
}

module.exports = function (casperPath, cwd) {
    return {
        start: function () {
            var sched = getNewSchedule();

            clientsWork.forEach(function (clientWork) {
                var cliId = clientWork.clientId,
                    cliConfig = clientWork.config,
                    watcher;

                if (clientWork.oneTimeTask) {
                    watcher = chokidar.watch(cliConfig.saleFilesDirectory, {
                        // ignore files/dirs that start with `.`
                        ignored: /[\/\\]\./,
                        persistent: true,
                        ignoreInitial: true
                    });

                    // on file add
                    watcher.on('add', function (filePath) {
                        processClientWork(clientWork, {
                            oneTimeTask: clientWork.oneTimeTask,
                            fileData: {
                                absolutePath: filePath,
                                fileName: path.basename(filePath)
                            }
                        });
                    }).on('', function () {
                        logger.info(
                            'Initial directory scan [%s] for [%s] client complete. Watching dir..',
                            cliConfig.saleFilesDirectory,
                            cliId
                        );
                    }).on('error', function (err) {
                        /**
                         * SEND EMAIL, NOTIFY ERROR
                         */
                        logger.errorNotification(
                            'An error happened while procesing [%s] client (watch directory mode)\n' +
                            'Please verify the error.\n Error message: %s',
                            cliId,
                            err.message
                        );
                    });
                } else {
                    later.setTimeout(function () {
                        processClientWork(clientWork, {
                            casperPath: casperPath,
                            cwd: cwd
                        });
                    }, sched);
                }
            });
        }
    };
};
