'use strict';
var fs = require('fs');
var assert = require('assert');
var nodemailer = require('nodemailer');
var utils = require('util');

var path = require('path'),
    spawn = require('child_process').spawn,
    concat = require('concat-stream'),
    ClientProccessDispatcher = require('../ClientProccessDispatcher'),
    logger = require('./loggers/saga'),
    config = require('../../config/index'),
    mainCasperScript = 'navigation/saga_login.js',
    mainCasperScript_1 = 'navigation/saga_downloads.js',
    proccessData = require('./proccess-data/saga.js');

var CLIENT_ID = 'SAGA FALABELLA',
    GLOBAL_CONFIG = config.get('common'),
    SAGA_CONFIG = config.get('saga');

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
    logger.info('Initializing new processing task..');
    logger.info('Trying to initialize casperjs..');
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
        if (infosales.idSales.length > 0) {
            generateReport(mainCasperScript_1, casperPath, cwd, infosales.idSales.length, call_);
        } else {
            logger.error("No existen Retails para generar Reporte TOTTUS_LOGIN()");
        }
    });
    casperProcess.stdout.pipe(dataStream);
    return emitter;
};

function call_(casperPath, cwd) {
    if (infosales.idSales.length > 0) {
        infosales.idSales.splice(0, 1);
        infosales.nameSales.splice(0, 1);
        if (infosales.idSales.length > 0) {
            generateReport(mainCasperScript_1, casperPath, cwd, infosales.idSales.length, call_);
        }
    } else {
        console.log("Ya no existen item para lectura");
    }
}

function generateReport(main, casperpath, cwd, countprocess, callback) {
    countReport++;
    console.log("Totales Reportes: " + countReport);
    var infosalesformat = {}, idsale = [], namesales = [], formatcomplet = null;

    /*Refomatear los nombre de las tiendas, ya que no vienen limpias de espacio, guiones y algun otro formato*/
    for (var i = 0; i < infosales.nameSales.length; i++) {
        var store = infosales.nameSales[i];
        var storesplit = store.split('-');
        if (storesplit.length > 1) {
            idsale.push(infosales.idSales[i]);
            namesales.push(storesplit[1]);
        } else {
            idsale.push(infosales.idSales[i]);
            namesales.push(storesplit[0]);
        }
    }

    infosalesformat.idSales = idsale;
    infosalesformat.nameSales = namesales;

    /* (1) */
    casperArgs_1 = setParameters(main, infosalesformat);
    /* (2) */
    casperProcess_1 = spawn(casperpath, casperArgs_1, {cwd: cwd});
    /* (3) */
    setProcess(casperProcess_1);
    /* (4) */
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
                proccessData(emitter, CLIENT_ID, fileData, countprocess, function () {
                    callback(casperpath, cwd);
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
    var pa = [];
    pa.push(path.join(__dirname, main));
    pa.push(SAGA_CONFIG.website);
    pa.push(SAGA_CONFIG.corporationId);
    pa.push(SAGA_CONFIG.username);
    pa.push(SAGA_CONFIG.pwd);
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

module.exports.clientId = CLIENT_ID;
module.exports.config = SAGA_CONFIG;