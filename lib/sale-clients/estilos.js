'use strict';

var ClientProccessDispatcher = require('../ClientProccessDispatcher'),
    logger = require('./loggers/estilos'),
    config = require('../../config/'),
    Promises = require('bluebird'),
//proccessData = require('./proccess-data/estilos'),
    moment = require('moment'),
    utilRead = require('../utilReadFile');

var CLIENT_ID = 'ESTILOS',
    ESTILOS_CONFIG = config.get('estilos');


var FIELDMAP_IN_FILE = {},
    files = [],
    now,
    month = "",
    year = "",
    pathsplit = "",
    codperiod = "",
    codretail = "",
    path = "";


module.exports = function (fileData) {
    debugger;

    var emitter = new ClientProccessDispatcher(CLIENT_ID);

    logger.info('Initializing new processing task..');
    logger.info('Trying to process sale file data..');

    files.push(fileData.absolutePath);

    setImmediate(function () {

        //pathsplit = fileData.absolutePath.split("\\");
        //now = moment();
        //month = now.get('month');
        //year = now.get('year');


        //if (pathsplit.length == 6) {
        //    utilRead.getDataPeriodByCurrentMothandYear(month + 1, year).then(function (period) {
        //        codperiod = period.codperiod;
        //        return utilRead.getCodRetail(CLIENT_ID);
        //    }).then(function (cod) {
        //        codretail = cod;
        //        return null;
        //    }).then(function () {
        //        return utilRead.getComCarga(codperiod, codretail);
        //    }).then(function (result) {
        //        path = result.path;
        //        debugger;
        //        //proccessData(emitter, CLIENT_ID, FIELDMAP_IN_FILE, fileData);
        //    });
        //} else {
        //    logger.error("La ruta " + pathsplit + " no es la adecuada!!");
        //}

        processFiles(files);

        console.log("PROCESSDATA ESTILOS");

    });

    return emitter;

}

function processFiles(data) {
    return Promises.resolve(data).each(function (path) {
        console.log("Process");
        pathsplit = path.absolutePath.split("\\");
        now = moment();
        month = now.get('month');
        year = now.get('year');

        if (pathsplit.length == 6) {
            return utilRead.getDataPeriodByCurrentMothandYear(month + 1, year).then(function (period) {
                codperiod = period.codperiod;
                return utilRead.getCodRetail(CLIENT_ID);
            }).then(function (cod) {
                codretail = cod;
                return null;
            }).then(function () {
                return utilRead.getComCarga(codperiod, codretail);
            }).then(function (result) {
                path = result.path;
                debugger;
                //proccessData(emitter, CLIENT_ID, FIELDMAP_IN_FILE, fileData);
            });
        } else {
            logger.error("La ruta " + pathsplit + " no es la adecuada!!");
        }

    })
}

module.exports.oneTimeTask = true;
module.exports.clientId = CLIENT_ID;
module.exports.config = ESTILOS_CONFIG;
