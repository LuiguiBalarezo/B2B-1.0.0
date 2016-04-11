'use strict';

var ClientProccessDispatcher = require('../ClientProccessDispatcher'),
    logger = require('./loggers/estilos'),
    config = require('../../config/'),
    proccessData = require('./proccess-data/estilos');

debugger;
var CLIENT_ID = 'ESTILOS',
    INITIALPATH = config.get('configfolder'),
    ESTILOS_CONFIG = config.get('estilos');

var FIELDMAP_IN_FILE = {};

module.exports = function (fileData) {
    var emitter = new ClientProccessDispatcher(CLIENT_ID);

    logger.info('Initializing new processing task..');
    logger.info('Trying to process sale file data..');

    setImmediate(function () {

        console.log("PROCESSDATA ESTILOS");
        //proccessData(emitter, CLIENT_ID, FIELDMAP_IN_FILE, fileData);
    });

    return emitter;

}

module.exports.oneTimeTask = true;
module.exports.clientId = CLIENT_ID;
module.exports.config = ESTILOS_CONFIG.saleFilesDirectory = INITIALPATH.pathinitial;


debugger;