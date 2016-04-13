'use strict'

module.exports = function (sequelize, Datatypes) {
    var ComCarga = sequelize.define('ComCarga', {
        codCarga: {
            type: Datatypes.STRING(6),
            primaryKey: true
        },
        extension : {
            type: Datatypes.STRING(10)
        },
        nombre : {
            type: Datatypes.STRING(100)
        },
        path: {
            type: Datatypes.STRING(200)
        }
    }, {
        timestamps: true,
        createdAt: false,
        updatedAt: false,
        deletedAt: false,
        freezeTableName: true,
        tableName: 'comcarga'
    });

    return ComCarga

};