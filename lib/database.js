'use strict';

var fs = require('fs'),
    path = require('path'),
    Sequelize = require('sequelize'),
    config = require('../config/'),
    pathModels = path.join(__dirname, 'models'),
    db = {},
    sequelize;

var isProduction = config.get('NODE_ENV') === 'production' ? true : false,
    dbConfig = config.get('database');

sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password !== '' ? dbConfig.password : null,
  {
    dialect: 'mysql',
    logging: isProduction ? false : console.log,
    host: dbConfig.host,
    port: dbConfig.port,
    // this option tells sequelize to store
    // and parse all dates values in PERU TIMEZONE,
    // otherwhise it will store dates in UTC
    timezone: '-05:00'
  }
);

fs.readdirSync(pathModels)
  .filter(function(file) {
    return file.indexOf('.') !== 0;
  })
  .forEach(function(file) {
    var model = sequelize['import'](path.join(pathModels, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

if (!module.parent) {
  sequelize.sync().success(function() {
    console.log('Models are sync!!');
  });
}

module.exports = db;
