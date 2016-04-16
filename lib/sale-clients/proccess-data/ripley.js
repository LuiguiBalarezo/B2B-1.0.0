'use strict';

var util = require('util'),
    utilRead = require('../../utilReadFile'),
    Promises = require('bluebird'),
    math = require('mathjs'),
    moment = require('moment'),
    XLSX = require('xlsx'),
    utils = require('../../utils'),
    logger = require('../loggers/ripley'),
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

// constants
var DATA_SHEET_NAME = 'semanal',
    DATE_FORMAT = 'DD/MM/YYYY',
    DATA_HEADER_SECTION_REGEX_FORMAT = /sucursal/i,
    CELL_REGEX = utils.EXCEL_CELL_REGEX,
    ROW_START_DATA_SECTION = 45;

module.exports = function (emitter, clientId, ROWS, fileData, folderperiod, folderyear) {

    var now = moment(),
        absolutePathToFile = fileData.absolutePath,
        fileName = fileData.fileName,
        fileNameFormat = new RegExp('^' + clientId + '.*\\.xlsx$', 'i'),
        fileNameErrMsg = 'The evaluated file (' + fileName + ') does not match with the expected format.',
        log;

    logger.info('Checking file name format..');

    if (!fileNameFormat.test(fileName)) {
        logger.info('File name format is wrong!, fileName: %s', fileName);
        return emitter.emit('error', new Error(fileNameErrMsg));
    }

    logger.info('Checking sale file existence..');


    log = {
        codB2B: clientId,
        fileName: fileName,
        // dont have a url, because is processed from file system
        downloadUrl: '',
        downloadedAt: now.toDate()
    };


    var rowPromises = [],
        salesData = [],
        workbook,
        salesWorkSheet,
        saleDate,
        filteredCellNames;

    var processState = {
        currentRow: null,
        currentData: null
    };

    logger.info('Processing data of sale file..');

    //workbook = XLSX.readFile(absolutePathToFile);
    //salesWorkSheet = workbook.Sheets[DATA_SHEET_NAME];
    //
    //
    //
    //console.log(JSON.stringify(salesWorkSheet[ROWS.store + ROW_START_DATA_SECTION].v) + " " + salesWorkSheet[ROWS.nameproduc + ROW_START_DATA_SECTION].v + " " +   salesWorkSheet[ROWS.sale + ROW_START_DATA_SECTION].v);

    debugger;

    //utilRead.setColumnsReadInFile("Vta. Período(u)", "Descripción Producto");
    sheets = utilRead.readFileXLS(absolutePathToFile, false);
    sheets = sheets._settledValue;
    //console.log(sheets);
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
            return utilRead.getInfoRetailByName(clientId);
        }).then(function (retail) {
            if (retail.exists) {
                codretail = retail.codretail;
                nameretail = retail.nameretail;
                return null;
            } else {
                console.log("No existe el retail " + retail.nameretail + " registrado en la base de datos!!!.");
            }
        }).then(function () {
            return utilRead.getStoresFormat(sheets);
        }).then(function (stores) {
            allstorearrays = stores;
            console.log("Todas las tiendas: " + allstorearrays);
            return utilRead.getSaleFormat(sheets);
        }).then(function (sales) {

            allstorearrays.forEach(function (namestore) {
                console.log("for : " + namestore);
                utilRead.searchStore(codretail, namestore).then(function (storeinfo) {
                    if (storeinfo.exists) {
                        utilRead.processSale_3(codretail, codperiod, storeinfo.codstore, storeinfo.description, sales).then(function (result) {
                               utilRead.proccessProducts(codretail, codperiod, result);
                        });
                    } else {
                        console.log("TIENDA NO EXISTENTE.. | " + storeinfo.description);
                    }
                })
            });

        });
    }

}