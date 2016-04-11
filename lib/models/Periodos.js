'use strict'

module.exports = function (sequelize, Datatypes) {
    var Periodos = sequelize.define('Periodos', {
        id: {
            type: Datatypes.STRING(6),
            primaryKey: true
        },
        fecha_inicio: {
            type: Datatypes.DATE()
        },
        fecha_final: {
            type: Datatypes.DATE()
        },
        mes: {
            type: Datatypes.INTEGER(11)
        },
        anio: {
            type: Datatypes.INTEGER(11)
        },
        descripcion: {
            type: Datatypes.STRING(50)
        },
        venta_cuota: {
            type: Datatypes.STRING(1)
        },
        venta_efectiva: {
            type: Datatypes.STRING(1)
        },
        venta_efectiva_linea: {
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
        tableName: 'periodos'
    });

    return Periodos

};