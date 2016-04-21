'use strict';

var ClientProccessDispatcher = require('../ClientProccessDispatcher'),
    logger = require('./loggers/estilos'),
    config = require('../../config/'),
    Promises = require('bluebird'),
    proccessDataEstilos = require('./proccess-data/estilos'),
    proccessDataOechsle = require('./proccess-data/oechsle'),
    proccessDataParis = require('./proccess-data/paris'),
    proccessDataMetro = require('./proccess-data/metro'),
    proccessDataMario = require('./proccess-data/mario'),
    proccessDataLlontop = require('./proccess-data/llontop'),
    proccessDataQuispe = require('./proccess-data/quispe'),
    proccessDataYucra = require('./proccess-data/yucra'),
    proccessDataDimersa = require('./proccess-data/dimersa'),
    proccessDataPredilecta = require('./proccess-data/predilecta'),
    proccessDataImportacionesCasel = require('./proccess-data/importacionescasel'),
    proccessDataImportacionesSur = require('./proccess-data/importacionessur'),
    proccessDataComercialRivera = require('./proccess-data/comercialrivera'),
    proccessDataCrediVargas = require('./proccess-data/credivargas'),
    proccessDataSagaFalabella = require('./proccess-data/saga'),
    proccessDataSagaRipley = require('./proccess-data/ripley'),
    moment = require('moment'),
    utilRead = require('../utilReadFile');

var CLIENT_ID = 'ESTILOS',
    ESTILOS_CONFIG = config.get('estilos');


var FIELDMAP_IN_FILE = {},
    files = [],
    now,
    pathsplit = "",
    codperiod = "",
    codretail = "",
    path = "",
    file = "",
    filesplit = "",
    namefile = "",
    foldermonth = "",
    folderyear = "";


module.exports = function (fileData) {
    debugger;

    var emitter = new ClientProccessDispatcher(CLIENT_ID);

    logger.info('Initializing new processing task..');
    logger.info('Trying to process sale file data..');

    files.push(fileData.absolutePath);

    setImmediate(function () {

        pathsplit = fileData.absolutePath.split("\\");

        if (pathsplit.length == 6) {
            file = pathsplit[pathsplit.length - 1];
            filesplit = file.split(".");
            namefile = filesplit[0];

            folderyear = pathsplit[3];
            foldermonth = pathsplit[4];

            switch (namefile) {
                case "ripley":
                    logger.info('Procesa Ripley..');
                    proccessDataSagaRipley(emitter, namefile, fileData, foldermonth, folderyear);
                    break;
                case "estilos":
                    logger.info('Procesa estilos..');
                    proccessDataEstilos(emitter, namefile, fileData, foldermonth, folderyear);
                    break;
                case "paris":
                    logger.info('Procesa paris..');
                    proccessDataParis(emitter, namefile, fileData, foldermonth, folderyear);
                    break;
                case "metro":
                    logger.info('Procesa metro..');
                    proccessDataMetro(emitter, namefile, fileData, foldermonth, folderyear);
                    break;
                case "wong":
                    logger.info('Procesa wong..');
                    break;
                case "oechsle":
                    logger.info('Procesa oechsle..');
                    proccessDataOechsle(emitter, namefile, fileData, foldermonth, folderyear);
                    break;
                case "yucra":
                    logger.info('Procesa yucra..');
                    proccessDataYucra(emitter, namefile, fileData, foldermonth, folderyear);
                    break;
                case "quispe":
                    logger.info('Procesa quispe..');
                    proccessDataQuispe(emitter, namefile, fileData, foldermonth, folderyear);
                    break;
                case "llontop":
                    logger.info('Procesa llontop..');
                    proccessDataLlontop(emitter, namefile, fileData, foldermonth, folderyear);
                    break;
                case "mario":
                    logger.info('Procesa mario..');
                    proccessDataMario(emitter, namefile, fileData, foldermonth, folderyear);
                    break;
                case "comercialrivera":
                    logger.info('Procesa comercialrivera..');
                    proccessDataComercialRivera(emitter, namefile, fileData, foldermonth, folderyear);
                    break;
                case "credivargas":
                    logger.info('Procesa credivargas..');
                    proccessDataCrediVargas(emitter, namefile, fileData, foldermonth, folderyear);
                    break;
                case "dimersa":
                    logger.info('Procesa dimersa..');
                    proccessDataDimersa(emitter, namefile, fileData, foldermonth, folderyear);
                    break;
                case "importacionescasel":
                    logger.info('Procesa importacionescasel..');
                    proccessDataImportacionesCasel(emitter, namefile, fileData, foldermonth, folderyear);
                    break;
                case "importacionessur":
                    logger.info('Procesa importacionessur..');
                    proccessDataImportacionesSur(emitter, namefile, fileData, foldermonth, folderyear);
                    break;
                case "predilecta":
                    logger.info('Procesa predilecta..');
                    proccessDataPredilecta(emitter, namefile, fileData, foldermonth, folderyear);
                    break;
                case "sagafalabella":
                    logger.info('Procesa predilecta..');
                    proccessDataSagaFalabella(emitter, namefile, fileData, foldermonth, folderyear);
                    break;
            }

        } else {
            logger.error("La ruta " + pathsplit + " no es la adecuada!!");
        }

        //console.log("PROCESSDATA ESTILOS");

    });

    return emitter;

}


module.exports.oneTimeTask = true;
module.exports.clientId = CLIENT_ID;
module.exports.config = ESTILOS_CONFIG;
