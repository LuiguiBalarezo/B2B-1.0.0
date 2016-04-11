'use strict';
//
var fs = require('fs');
var assert = require('assert');
var nodemailer = require('nodemailer');
var utils = require('util');

var path = require('path'),
    spawn = require('child_process').spawn,
    concat = require('concat-stream'),
    ClientProccessDispatcher = require('../ClientProccessDispatcher'),
    logger = require('./loggers/tottus'),
    config = require('../../config/index'),
    mainCasperScript = 'navigation/tottus_login.js',
    mainCasperScript_1 = 'navigation/tottus_downloads.js',
    proccessData = require('./proccess-data/tottus.js');

var CLIENT_ID = 'TOTTUS',
    GLOBAL_CONFIG = config.get('common'),
    TOTTUS_CONFIG = config.get('tottus');

var name_file = "", name_file_2 = "", error = "", transporter, mailOptions, dia, mes, anio;

var emitter = new ClientProccessDispatcher(CLIENT_ID),
    casperArgs,
    casperProcess,
    dataStream,
    casperArgs_1,
    casperProcess_1,
    dataStream_1,
    infosales,
    countReport = 0;



module.exports = function (casperPath, cwd) {
    //
    logger.info('Initializing new processing task..');
    logger.info('Trying to process sale file data..');
    /* (1) asignar los parametros a casper */
    casperArgs = setParameters(mainCasperScript, null);
    /* (2) generar nuevo proceso */
    casperProcess = spawn(casperPath, casperArgs, {cwd: cwd});
    /* (3) llamadas de inicio de procesos */
    setProcess(casperProcess);
    /* (4) canal para obtener errores */
    process.stderr.setMaxListeners(0);
    casperProcess.stdout.setEncoding('utf8');
    casperProcess.stderr.setEncoding('utf8');
    /* (5) Obtener toda la data extraida de casperjs */
    dataStream = concat(function (fileData) {

        infosales = getData(fileData);

        var indexsales = infosales.idSales.length;

        if (indexsales > 0) {
             generateReport(mainCasperScript_1, infosales, casperPath, cwd, call_);
        } else {
            logger.error("No existen Retails para generar Reporte TOTTUS_LOGIN()");
        }
    });
    casperProcess.stdout.pipe(dataStream);
    return emitter;
}

function call_(info_Sales, casperPath, cwd) {
    //
    var indexsales = info_Sales.idSales.length;
    if (indexsales > 0) {
        info_Sales.idSales.splice(0, 1);
        info_Sales.nameSales.splice(0, 1);
        generateReport(mainCasperScript_1, info_Sales, casperPath, cwd, call_);
    } else {
    }
}

function generateReport(main, info_Sales, casperpath, cwd, callback) {



    countReport++;
    console.log("Totales Reportes: " + countReport);



    /* (1) asignar los parametros a casper */
    casperArgs_1 = setParameters(main, info_Sales);
    /* (2) generar nuevo proceso */
    casperProcess_1 = spawn(casperpath, casperArgs_1, {cwd: cwd});
    /* (3) llamadas de inicio de procesos */
    setProcess(casperProcess_1);
    /* (4) canal para obtener errores */
    dataStream_1 = concat(function (fileData) {


        var emptyMsg = 'The file received DATA REPORT from casperjs is null..';
        logger.info('Sale file from casperjs received..');

        try {
            fileData = JSON.parse(fileData);
        } catch (err) {
            logger.error('Error while trying to `JSON.parse` fileData DATA REPORT generateReport()');
            logger.error('ERROR: ' + fileData);
            emitter.emit('error', new Error(err.message + ', Received from Casper: ' + fileData));
            fileData = null;
            return;
        }

        if (fileData != null) {
            logger.info('Trying to process sale file DATA REPORT ..');
            setImmediate(function () {
                //
                proccessData(emitter, CLIENT_ID, fileData, function () {

                    callback(info_Sales, casperpath, cwd);
                });
            })
        } else {
            logger.error(emptyMsg);
            emitter.emit('error', new Error(emptyMsg));
        }

    });
    /* (5) */
    casperProcess_1.stdout.pipe(dataStream_1);
}

function setParameters(main, params) {
    //
    var pa = [];
    pa.push(path.join(__dirname, main));
    pa.push(TOTTUS_CONFIG.website);
    pa.push(TOTTUS_CONFIG.corporationId);
    pa.push(TOTTUS_CONFIG.username);
    pa.push(TOTTUS_CONFIG.pwd);
    pa.push(GLOBAL_CONFIG.snapshotPath || false);
    if (params != null) {
        pa.push(params.idSales[0]);
        pa.push(params.nameSales[0]);
        console.log("IDSALES SELECIONADO:-----" + params.idSales[0] + " TEXTSALES SELECCIONADO: -----" + params.nameSales[0]);
    }
    pa.push('--ignore-ssl-errors=true');
    pa.push('--local-to-remote-url-access=true');
    pa.push('--ssl-protocol=tlsv1');
    return pa;
}

function setProcess(pro) {
    //
    pro.stdout.setEncoding('utf8');
    pro.stderr.setEncoding('utf8');
    pro.stderr.on('data', function (data) {
        data = data.trim();
        if (data.length) {
            logger.error('Error from casperjs: %s', data);
        }
        emitter.emit('error', new Error(data));
    });
    pro.on('close', function (code) {
        //logger.debug('Casperjs process exit with code: ' + code);
    });
}

function getData(fileData) {
    ////
    var emptyMsg = 'The file received from casperjs is null..';
    try {
        fileData = JSON.parse(fileData);
    } catch (err) {
        logger.error('Error while trying to `JSON.parse` fileData getData() ');
        emitter.emit('error', new Error(err.message + ', Received from Casper: ' + fileData));
        fileData = null;
        return null;
    }

    if (fileData != null) {
        return fileData;
    } else {
        logger.error(emptyMsg);
        emitter.emit('error', new Error(emptyMsg));
        return null;
    }
}


//module.exports.oneTimeTask = true;
module.exports.clientId = CLIENT_ID;
module.exports.config = TOTTUS_CONFIG;