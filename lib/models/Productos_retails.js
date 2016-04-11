/**
 * Created by Usuario on 22/01/2016.
 */
'use strict'

module.exports = function (sequelize, Datatypes) {
    var Productos_retails = sequelize.define('Productos_retails', {
        id: {
            type: Datatypes.STRING(6),
            primaryKey: true
        },
        descripcion: {
            type: Datatypes.STRING(200)
        },
        codRetail: {
            type: Datatypes.STRING(6)
        },
        codEq: {
            type: Datatypes.STRING(6)
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
        tableName: 'productos_retails'
    });

    return Productos_retails

};
