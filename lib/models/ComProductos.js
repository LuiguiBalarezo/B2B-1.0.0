/**
 * Created by Usuario on 22/01/2016.
 */
'use strict'

module.exports = function (sequelize, Datatypes) {
    var ComProductos = sequelize.define('ComProductos', {
        codProducto: {
            type: Datatypes.STRING(6),
            primaryKey: true
        },
        audFechaCrea: {
            type: Datatypes.DATE()
        },
        audFechaModifica: {
            type: Datatypes.DATE()
        },
        audIPCrea: {
            type: Datatypes.STRING(50)
        },
        audIPModifica: {
            type: Datatypes.STRING(50)
        },
        audPCCrea: {
            type: Datatypes.STRING(30)
        },
        audPCModifica: {
            type: Datatypes.STRING(30)
        },
        audUsuarioCrea: {
            type: Datatypes.STRING(15)
        },
        audUsuarioModifica: {
            type: Datatypes.STRING(15)
        },
        codInterno: {
            type: Datatypes.STRING(25)
        },
        descripcion: {
            type: Datatypes.STRING(200)
        },
        indBloqueado: {
            type: Datatypes.STRING(1)
        },
        indEliminado: {
            type: Datatypes.STRING(1)
        },
        codLinea: {
            type: Datatypes.STRING(6)
        },
        nombre: {
            type: Datatypes.STRING(100)
        },
        precioCosto: {
            type: Datatypes.DECIMAL(19, 2)
        },
        pvd: {
            type: Datatypes.DECIMAL(19, 2)
        }
    }, {
        timestamps: false,
        createdAt: false,
        updatedAt: false,
        deletedAt: false,
        freezeTableName: true,
        tableName: 'comproducto'
    });

    return ComProductos

};
