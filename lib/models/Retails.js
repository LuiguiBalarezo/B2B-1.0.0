/**
 * Created by Usuario on 22/01/2016.
 */
'use strict'

module.exports = function (sequelize, Datatypes) {
    var Retails = sequelize.define('Retails', {
        codRetail: {
            type: Datatypes.STRING(6),
            primaryKey: true
        },
        nombre: {
            type: Datatypes.STRING(100)
        }
    }, {
        timestamps: false,
        createdAt: false,
        updatedAt: false,
        deletedAt: false,
        freezeTableName: true,
        tableName: 'comretail'
    });

    return Retails

};
