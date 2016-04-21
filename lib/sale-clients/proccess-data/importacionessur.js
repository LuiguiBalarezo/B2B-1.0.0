'use strict';

var util = require('util'),
    utilRead = require('../../utilRead'),
    Promises = require('bluebird'),
    math = require('mathjs'),
    moment = require('moment'),
    utils = require('../../utils'),
    logger = require('../loggers/yucra'),
    db = require('../../database');

var sheets = [];

var codretail = "",
    nameretail = "",
    codperiod;


function generateError() {
    var args = [].slice.call(arguments);
    return new Error(util.format.apply(util, args));
}
var obj = {};

module.exports = function (emitter, clientId, fileData, folderperiod, folderyear) {

    var now = moment(),
        absolutePathToFile = fileData.absolutePath,
        fileName = fileData.fileName,
        fileNameFormat = new RegExp('^' + clientId + '.*\\.xlsx$', 'i'),
        fileNameErrMsg = 'The evaluated file (' + fileName + ') does not match with the expected format.',
        log;

    logger.info('Checking file name format..');
    var dateNow = now.toDate();
    if (!fileNameFormat.test(fileName)) {
        logger.info('File name format is wrong!, fileName: %s', fileName);
        return emitter.emit('error', new Error(fileNameErrMsg));
    }
    logger.info('Register new sale file log..');
    log = {
        codB2B: clientId,
        fileName: fileName,
        downloadUrl: '',
        downloadedAt: now.toDate()
    };
    utilRead.readFileXLS(absolutePathToFile, false).then(function (resultsheets) {
        /*Seccion: obtiener hojas*/
        sheets = resultsheets;
        if (sheets.length > 0) {
            return true;
        } else {
            console.log("No existe Hoja en el archivo procesado!!.");
        }
    }).then(function () {
        /** Obteniendo codmaxsale */
        utilRead.getCodMaxSale();
    }).then(function () {
        /** Seccion para obtener el periodo */
        return utilRead.getPeriod(folderperiod, folderyear);
    }).then(function (period) {
        /** Seccion verificacion de periodo */
        if (period.exists) {
            codperiod = period.codperiod;
            return null;
        } else {
            console.log("No Existe Periodo Registrado!!!.")
        }
    }).then(function () {
        /** Seccion obtener informacion del retail*/
        return utilRead.getInfoRetail("IMPORTACIONES SUR");
    }).then(function (inforetail) {
        // Seccion Verificacion de info Retail*//*
        if (inforetail.exists) {
            codretail = inforetail.codretail;
            nameretail = inforetail.nameretail;
            return null;
        } else {
            console.log("No existe el retail " + inforetail.nameretail + " registrado en la base de datos!!!.");
        }
    }).then(function () {
        /** Seccion obtener info de tiendas (tiendas - stores - sheets) */
        return utilRead.getInfoStores(codretail, sheets);
    }).then(function (stores) {
        return utilRead.getAllSales_standard(codretail, codperiod, stores, "PRODUCTOS", "CANTIDAD");
    }).then(function (sales) {
        return utilRead.getEnabledProducts(sales);
    }).then(function (productsprocess) {
        return utilRead.getFilterProductRepeat(productsprocess);
    }).then(function (saleswithrepeat) {
        utilRead.proccessSales(saleswithrepeat);
    })

}