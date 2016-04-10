'use strict';
//debugger;
var which = require('which'),
	logger = require('./lib/logger'),
	config = require('./config/');
	
logger.info('Application environment is: [%s]', config.get('NODE_ENV'));

//run configuration of modules
require('./boot')();

//verify that casperjs is installed
which('casperjs', function(err, execPath){
	if(err){
		var installErr = new Error([
		'The automatic install of CasperJS - PhantomJS, ',
		'which is used for the automatic navigation, seems to have failed. ',
		'Try installing casperjs with: npm install -g casperjs.\n',
		'Message: ' + err.message
		].join('\n'));
		
		installErr.noStack = true;
		throw installErr;
	}
	require('./lib/sale-clients')(execPath, __dirname).start();
    require('./lib/products-clients')(execPath, __dirname).start();
    require('./lib/products-oxford')(execPath, __dirname).start();

});
