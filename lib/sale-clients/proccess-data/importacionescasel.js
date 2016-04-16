'use strict';

var util = require('util'),
    utilRead = require('../../utilReadFile'),
    Promises = require('bluebird'),
    math = require('mathjs'),
    moment = require('moment'),
    XLSX = require('xlsx'),
    utils = require('../../utils'),
    logger = require('../loggers/importacionescasel'),
    db = require('../../database');

var workbook,
    sheets = [],
    worksheets,
    cod_oechsle,
    products = [],
    retail,
    nameretail,
    todayTimeStamp;

var codretail,
    descripcion,
    month = "",
    year = "",
    tmpSaleperiod,
    tmpdescrip,
    codmaxsaleeffective,
    codmaxstore,
    codventaefectivaformat,
    codmaxstoreformat,
    tmpcodstore,
    descriptionstore,
    codperiod,
    codmaxproductsretail,
    allstorearrays = "";

var storenamearrays = [],
    newobjectkeyarrays = [],
    name = "", pruebaequivalencia = {}, productsarrays = [], allproductsstores = [], salesproductsarrays = [],
    name_sheet = "", countproducts = 0;

function generateError() {
    var args = [].slice.call(arguments);
    return new Error(util.format.apply(util, args));
}

var obj = {};

module.exports = function (emitter, clientId, fileData, folderperiod, folderyear){

    var now = moment(),
        absolutePathToFile = fileData.absolutePath,
        fileName = fileData.fileName,
        fileNameFormat = new RegExp('^' + clientId + '.*\\.xlsx$', 'i'),
        fileNameErrMsg = 'The evaluated file (' + fileName + ') does not match with the expected format.',
        log;

    logger.info('Checking file name format..');

    todayTimeStamp = new Date;
    //month = now.get("month");
    year = now.get("year");

    var dateNow = now.toDate();

    if (!fileNameFormat.test(fileName)) {
        logger.info('File name format is wrong!, fileName: %s', fileName);
        return emitter.emit('error', new Error(fileNameErrMsg));
    }

    logger.info('Register new sale file log..');

    log = {
        codB2B: clientId,
        fileName: fileName,
        // dont have a url, because is processed from file system
        downloadUrl: '',
        downloadedAt: now.toDate()
    };

    debugger;
    sheets = utilRead.readFileXLS(absolutePathToFile, false);
    sheets = sheets._settledValue;
    console.log(sheets);
    if (utilRead.counSheets() > 0) {
        utilRead.getCodMaxSaleEffective().then(function (cod) {
            return null
        }).then(function () {
            return utilRead.getDataPeriodByCurrentMothandYear(folderperiod, folderyear);
        }).then(function (period) {
            if (period.exists) {
                codperiod = period.codperiod;
                return null;
            } else {
                console.log("No Existe Periodo Registrado!!!.")
            }
        }).then(function () {
            return utilRead.getInfoRetailByName("IMPORTACIONES CASEL");
        }).then(function (retail) {
            if (retail.exists) {
                codretail = retail.codretail;
                nameretail = retail.nameretail;
                return null;
            } else {
                console.log("No existe el retail " + retail.nameretail + " registrado en la base de datos!!!.");
            }
        }).then(function () {
            return sheets;
        }).then(function (stores) {
            stores.forEach(function (namestore) {
                utilRead.searchStore(codretail, namestore).then(function (storeinfo) {
                    if (storeinfo.exists) {
                        console.log("TIENDA EXISTE.. | " + storeinfo.description);
                        utilRead.processSale(codretail, storeinfo.codstore,  storeinfo.description, codperiod, "PRODUCTOS", "CANTIDAD")
                    } else {
                        console.log("TIENDA NO EXISTENTE.. | " + storeinfo.description);
                    }
                })
            })
        });
    }

}