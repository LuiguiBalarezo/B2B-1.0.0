/**
 * Created by Usuario on 28/08/2015.
 */
'use strict';

var utils = require('utils');

var diasSemana = new Array("Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado");
var f = new Date();

var casper = require('casper').create({
    colorizerType: 'Dummy', // prevent colorize text output
    verbose: false, // prevent casper to print messages to stdout
    logLevel: 'error', // casper only prints to stderr error messages
    viewportSize: {width: 800, height: 600},
    pageSettings: {
        webSecurityEnabled: false
    },
    clientScripts: ['jquery-1.6.1.js']
});

casper.userAgent("Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2049.0 Safari/537.36")

var fallabellaUrl,
    corporationId,
    username,
    pwd,
    saveFilesTo,
    downloadedFile = {},
    t = Date.now();

var linea = 3,
    dia = diasSemana[f.getDay()],
    idtienda,
    nametienda,
    temporada,
    orden = 1;

if(dia == "Lunes"){
    temporada = "SEMANT";
}else{
    temporada = "SEMACT";
}

if (casper.cli.args.length < 5) {
    casper.log('The casperjs script requires <url> <corporationId> <username> <pwd> parameters', 'error');
    casper.exit();
}

fallabellaUrl = casper.cli.get(0);
corporationId = casper.cli.get(1);
username = casper.cli.get(2);
pwd = casper.cli.get(3);
saveFilesTo = casper.cli.get(4);
idtienda = casper.cli.get(5);
nametienda = casper.cli.get(6);
var namestore_2 = casper.cli.get(7);
var namesotre_3 = casper.cli.get(8);

if(namestore_2 != undefined){
    nametienda += " "+casper.cli.get(7);
}

if(namesotre_3 != undefined){
    nametienda += " "+casper.cli.get(8);
}

function implementationOfPageChange(casp, reason) {
    casp.log([
        'Seems that the implementation of the site [' + fallabellaUrl + '] ',
        'has changed, please contact with technical support ',
        'for review this error. (Reason: ' + reason + ')'
    ].join(''), 'error');
    casp.exit();
}

casper.start(fallabellaUrl, function () {
    if (!this.exists('frame[name=mainFrame]')) {
        implementationOfPageChange(this, 'iframe[name=mainFrame] for the page not exists');
    }
});

casper.withFrame('mainFrame', function () {
    this.evaluate(function (cId, user, password) {
        var peruOpt = 4;
        document.querySelector('#CADENA').value = peruOpt;
        document.querySelector('#empresa').value = cId;
        document.querySelector('#usuario').value = user;
        document.querySelector('#clave').value = password;
    }, corporationId, username, pwd);
    this.click('#entrar2');
});

casper.withFrame('mainFrame', function () {
    this.click("#menuItem217_2");
});

casper.withFrame('mainFrame', function () {
    this.evaluate(function (l, tm, t, o) {
        document.querySelector('select[name="idLinea"]').value = l;
        document.querySelector('select[name="idTemporadaVenta"]').value = tm;
        document.querySelector('select[name="idTienda"]').value = t;
        document.querySelector('select[name="idOrdenarPor"]').value = o;
        //document.querySelector('input[name="idExcluye"]').checked = true;
    }, linea, temporada, idtienda, orden);

    this.click('input[name="botonBuscar"]');
});

casper.withFrame('mainFrame', function () {

    if (idtienda == undefined || nametienda == undefined) {
        idtienda = null;
        nametienda = null;
    }

    if (getLinkDonwload() != null) {
        downloadedFile.reportdata = this.base64encode(getLinkDonwload());
        downloadedFile.idsales = idtienda;
        downloadedFile.namesales = nametienda;
    } else {
        downloadedFile.reportdata = null;
        downloadedFile.idsales = null;
        downloadedFile.namesales = null;
    }
});

function getLinkDonwload() {
    return casper.evaluate(function () {
        return $('.displayTagcsv').parent('a').attr('href');
    });
}

t = Date.now();

casper.run(function () {
    t = Date.now() - t;
    this.echo(utils.serialize(downloadedFile));
    casper.exit();
});