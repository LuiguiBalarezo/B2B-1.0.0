'use strict'

module.exports = function (sequelize, Datatypes) {
    var CargaMasiva = sequelize.define('CargaMasiva', {
        id: {
            type: Datatypes.STRING(6),
            primaryKey: true
        },
        id_periodo: {
            type: Datatypes.STRING(6)
        },
        id_retail: {
            type: Datatypes.STRING(6)
        },
        id_tipo: {
            type: Datatypes.STRING(4)
        },
        path: {
            type: Datatypes.STRING(200)
        },
        nombre: {
            type: Datatypes.STRING(100)
        },
        estado_progreso: {
            type: Datatypes.STRING(1)
        },
        estado_registro: {
            type: Datatypes.STRING(1)
        },
        fecha_registro: {
            type: Datatypes.DATE()
        },
        fecha_modificacion: {
            type: Datatypes.DATE()
        }
    }, {
        timestamps: true,
        createdAt: false,
        updatedAt: false,
        deletedAt: false,
        freezeTableName: true,
        tableName: 'carga_masiva'
    });

    return CargaMasiva

};