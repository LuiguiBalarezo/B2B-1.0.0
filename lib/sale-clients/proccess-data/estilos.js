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
        return utilRead.getInfoRetail("ESTILOS");
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
        /** Seccion recolectar todos las tiendas (UNICO PARA FORMATO DE REPORTE ESTILOS) */
        return utilRead.getRecollectStores_estilos(sheets);
    }).then(function (stores) {
        /** Metodo unico para obtener info de los stores */
        return utilRead.getInfoStores_estilos(codretail, stores);
    }).then(function (stores) {
        return utilRead.getAllSales_estilos(codretail, codperiod, stores, sheets, "Descripcion");
    }).then(function (sales) {
        return utilRead.getEnabledProducts(sales);
    }).then(function (productsprocess) {
        return utilRead.getFilterProductRepeat(productsprocess);
    }).then(function (saleswithrepeat) {
        utilRead.proccessSales(saleswithrepeat);
    })




    ///** Seccion obtener info de tiendas (tiendas - stores - sheets) */
    //return utilRead.getInfoStores(codretail, sheets);
    //}).then(function (stores) {
    //    return utilRead.getAllSales_standard(codretail, codperiod, stores, "PRODUCTOS", "CANTIDAD");
    //}).then(function (sales) {
    //    return utilRead.getEnabledProducts(sales);
    //}).then(function (productsprocess) {
    //    return utilRead.getFilterProductRepeat(productsprocess);
    //}).then(function (saleswithrepeat) {
    //    utilRead.proccessSales(saleswithrepeat);
    //})

}

/*//'use strict';
 //
 //var util = require('util'),
 //    utilRead = require('../../utilReadFile'),
 //    Promises = require('bluebird'),
 //    math = require('mathjs'),
 //    moment = require('moment'),
 //    XLSX = require('xlsx'),
 //    utils = require('../../utils'),
 //    logger = require('../loggers/estilos'),
 //    db = require('../../database');
 //
 //
 //var workbook,
 //    sheets = [],
 //    worksheets,
 //    cod_oechsle,
 //    products = [],
 //    retail,
 //    nameretail,
 //    todayTimeStamp;
 //
 //var codretail,
 //    descripcion,
 //    tmpSaleperiod,
 //    tmpdescrip,
 //    codmaxsaleeffective,
 //    month = "",
 //    year = "",
 //    codmaxstore,
 //    codventaefectivaformat,
 //    codmaxstoreformat,
 //    tmpcodstore,
 //    descriptionstore,
 //    codperiod,
 //    codmaxproductsretail;
 //
 //var storenamearrays = [],
 //    newobjectkeyarrays = [],
 //    name = "", pruebaequivalencia = {}, productsarrays = [], allproductsstores = [], salesproductsarrays = [],
 //    name_sheet = "", countproducts = 0;
 //
 //function generateError() {
 //    var args = [].slice.call(arguments);
 //    return new Error(util.format.apply(util, args));
 //}
 //
 //var obj = {};
 //
 //
 //module.exports = function (emitter, clientId, fileData, folderperiod, folderyear){
 //    var now = moment(),
 //        absolutePathToFile = fileData.absolutePath,
 //        fileName = fileData.fileName,
 //        fileNameFormat = new RegExp('^' + clientId + '.*\\.xlsx$', 'i'),
 //        fileNameErrMsg = 'The evaluated file (' + fileName + ') does not match with the expected format.',
 //        log;
 //
 //    logger.info('Checking file name format..');
 //
 //    todayTimeStamp = new Date;
 //    //month = now.get("month");
 //    year = now.get("year");
 //
 //    var dateNow = now.toDate();
 //
 //    if (!fileNameFormat.test(fileName)) {
 //        logger.info('File name format is wrong!, fileName: %s', fileName);
 //        return emitter.emit('error', new Error(fileNameErrMsg));
 //    }
 //
 //    logger.info('Register new sale file log..');
 //
 //    log = {
 //        codB2B: clientId,
 //        fileName: fileName,
 //        // dont have a url, because is processed from file system
 //        downloadUrl: '',
 //        downloadedAt: now.toDate()
 //    };
 //*/
//    sheets = utilRead.readFileXLS(absolutePathToFile, false);
//    sheets = sheets._settledValue;
//    console.log(sheets);
//    if (utilRead.counSheets() > 0) {
//        utilRead.getCodMaxSaleEffective().then(function (cod) {
//            return null
//        }).then(function () {
//            return utilRead.getDataPeriodByCurrentMothandYear(folderperiod, folderyear);
//        }).then(function (period) {
//            if (period.exists) {
//                codperiod = period.codperiod;
//                return null;
//            } else {
//                console.log("No Existe Periodo Registrado!!!.")
//            }
//        }).then(function () {
//            return utilRead.getInfoRetailByName(clientId);
//        }).then(function (retail) {
//            if (retail.exists) {
//                codretail = retail.codretail;
//                nameretail = retail.nameretail;
//
//                return null;
//            } else {
//                console.log("No existe el retail " + retail.nameretail + " registrado en la base de datos!!!.");
//            }
//        }).then(function () {
//            return utilRead.processFormartStores(sheets);
//        }).then(function (stores) {
//            stores.forEach(function (namestore) {
//                utilRead.searchStore(codretail, namestore).then(function (storeinfo) {
//                    if(storeinfo.exists){
//                        /*Ya que estilos trabaja con una sola hoja,la seleccion del sheet se ra a mano sheet[0]*/
//                        utilRead.runReadProducts(codretail, codperiod, storeinfo.codstore, storeinfo.description, sheets[0]);
//                    }else{
//                        console.log("TIENDA NO EXISTENTE.. | " + storeinfo.description);
//                    }
//                })
//            })
//        })
//    }
//
//}


