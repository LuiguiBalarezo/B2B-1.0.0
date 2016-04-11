'use strict';

var utils = require('utils');

var casper = require('casper').create({
    colorizerType: 'Dummy', // prevent colorize text output
    verbose: false,
    logLevel: 'error', // casper only prints to stderr error messages
    clientScripts: ["jquery-1.6.1.js"],
    viewportSize: {width: 800, height: 600},
    pageSettings: {
        webSecurityEnabled: false
    }
});


casper.userAgent("Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2049.0 Safari/537.36")

var fallabellaUrl,
    corporationId,
    username,
    pwd,
    saveFilesTo,
    downloadedFile = {},
    t = Date.now();

/*id de las tiendas utilizadas por oxford*/
var Id_itemStoreRead = ["27", "93", "105"];

var options_values = null, options_text = null, idretails = [], nameretails = [];


if (casper.cli.args.length < 5) {
    casper.log('The casperjs script requires <url> <corporationId> <username> <pwd> parameters', 'error');
    casper.exit();
}

fallabellaUrl = casper.cli.get(0);
corporationId = casper.cli.get(1);
username = casper.cli.get(2);
pwd = casper.cli.get(3);
saveFilesTo = casper.cli.get(4);

function implementationOfPageChange(casp, reason) {
    casp.log([
        'Seems that the implementation of the site [' + fallabellaUrl + '] ',
        'has changed, please contact with technical support ',
        'for review this error. (Reason: ' + reason + ')'
    ].join(''), 'error');
    casp.exit();
}

function takeSnapshot(casp, pictureName) {
    if (saveFilesTo) {
        casp.capture('snapshots/' + pictureName);
    }
}

casper.start(fallabellaUrl, function () {
    if (!this.exists('frame[name=mainFrame]')) {
        implementationOfPageChange(this, 'iframe[name=mainFrame] for the page not exists');
    }
});

casper.withFrame('mainFrame', function () {
    this.evaluate(function (cId, user, password) {
        var peruOpt = 5;
        document.querySelector('#CADENA').value = peruOpt;
        document.querySelector('#empresa').value = cId;
        document.querySelector('#usuario').value = user;
        document.querySelector('#clave').value = password;
    }, corporationId, username, pwd);
    takeSnapshot(this, "TottusLogin.png");
    this.click('#entrar2');
});

casper.withFrame('mainFrame', function () {
    takeSnapshot(this, "TottusMenu.png");
    this.click("#menuItem217_2");
});

casper.withFrame('mainFrame', function () {

    this.evaluate(function () {
        document.querySelector('select[name="idTienda"]').style.backgroundColor = '#ffcc00';
        document.querySelector('select[name="idTienda"]').value = "139";
    });

    options_values = this.evaluate(function (idstores) {
        var x = document.querySelector('select[name="idTienda"]');
        var values_select = [];
        for (var i = 0; i < x.length; i++) {
            if (idstores.indexOf(x.options[i].value) != -1) {
                values_select.push(x.options[i].value);
            }
        }
        return values_select;
    }, Id_itemStoreRead);

    options_text = this.evaluate(function (idstores) {
        var x = document.querySelector('select[name="idTienda"]');
        var text_select = [];
        for (var i = 0; i < x.length; i++) {
            if (idstores.indexOf(x.options[i].value) != -1) {
                text_select.push(x.options[i].text);
            }
        }
        return text_select;
    }, Id_itemStoreRead);


    downloadedFile.idSales = options_values;
    downloadedFile.nameSales = options_text;

    takeSnapshot(this, "TottusVentas.png");
});

casper.run(function () {
    this.echo(utils.serialize(downloadedFile));
    casper.exit();
});
