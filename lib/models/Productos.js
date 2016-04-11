/**
 * Created by Usuario on 22/01/2016.
 */
'use strict'

module.exports = function (sequelize, Datatypes) {
    var Productos = sequelize.define('Productos', {
        id: {
            type: Datatypes.STRING(6),
            primaryKey: true
        },
        id_linea: {
            type: Datatypes.STRING(4)
        },
        codigo: {
            type: Datatypes.STRING(25)
        },
        descripcion: {
            type: Datatypes.STRING(200)
        },
        precio_costo: {
            type: Datatypes.DECIMAL(12, 2)
        },
        pvd: {
            type: Datatypes.DECIMAL(12, 2)
        },
        estado_registro: {
            type: Datatypes.STRING(30)
        },
        fecha_registro: {
            type: Datatypes.DATE()
        },
        fecha_modificacion: {
            type: Datatypes.DATE()
        }
    }, {
        timestamps: false,
        createdAt: false,
        updatedAt: false,
        deletedAt: false,
        freezeTableName: true,
        tableName: 'productos'
    });

    return Productos

};
