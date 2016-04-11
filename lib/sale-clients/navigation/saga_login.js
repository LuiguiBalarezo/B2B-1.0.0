'use strict';

/* OBSERVATION: THIS IS A CASPERJS SCRIPT, NOT A NODEJS SCRIPT */
var utils = require('utils');

var casper = require('casper').create({
    colorizerType: 'Dummy', // prevent colorize text output
    verbose: false, // prevent casper to print messages to stdout
    logLevel: 'error', // casper only prints to stderr error messages
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
var Id_itemStoreRead = ["724", "10"/*, "13", "866", "885", "424", "665", "664", "12", "11", "524", "1106", "1245", "1364", "1266", "908", "986", "745", "19", "744", "864", "17", "564", "12"*/];

var options_values, options_text, idretails = [], nameretails = [],
    file = null;

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
        var peruOpt = 4;
        document.querySelector('#CADENA').value = peruOpt;
        document.querySelector('#empresa').value = cId;
        document.querySelector('#usuario').value = user;
        document.querySelector('#clave').value = password;
    }, corporationId, username, pwd);

    takeSnapshot(this, 'SAGAfillingLogin.png');
    this.click('#entrar2');
});

casper.withFrame('mainFrame', function () {
    takeSnapshot(this, 'SAGAfillingMenu.png');
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

    takeSnapshot(this, "sAGAVentas.png");

});

casper.run(function () {
    this.echo(utils.serialize(downloadedFile));
    this.exit();
});



