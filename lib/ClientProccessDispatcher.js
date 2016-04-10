'use strict';

var util = require('util'),
    EventEmitter = require('events').EventEmitter;

function ClientProccessDispatcher(clientId) {
    EventEmitter.call(this);
    this.clientId = clientId;
}

util.inherits(ClientProccessDispatcher, EventEmitter);

module.exports = ClientProccessDispatcher;
