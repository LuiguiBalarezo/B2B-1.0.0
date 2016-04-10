'use strict';

var resumer = require('resumer'),
    base64 = require('base64-stream'),
    byline = require('byline');

exports.getSaleInfo = function(line, fieldMapInFile) {
    var saleInfo = {},
        fields = line.split('|');

    fields.forEach(function(val, index) {
        saleInfo[fieldMapInFile[index]] = val;
    });

    return saleInfo;
};

exports.getStream = function(data) {
    var rawStream = resumer().queue(data).end(), // create a stream from string
        lineStream = byline(rawStream.pipe(base64.decode()));
    lineStream.setEncoding('utf8');
    return lineStream;
};