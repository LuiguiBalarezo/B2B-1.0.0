/**
 * Created by Usuario on 22/01/2016.
 */
'use strict'
module.exports = function (sequelize, Datatypes) {
    var SisPeriodos = sequelize.define('SisPeriodos', {
        codPeriodo: {
            type: Datatypes.STRING(6),
            primaryKey: true
        },
        anio: {
            type: Datatypes.INTEGER(11)
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
        descripcion: {
            type: Datatypes.STRING(200)
        },
        fechaFin: {
            type: Datatypes.DATE()
        },
        fechaInicio: {
            type: Datatypes.DATE()
        },
        indBloqueado: {
            type: Datatypes.STRING(1)
        },
        indEliminado: {
            type: Datatypes.STRING(1)
        },
        indProcesoCuota: {
            type: Datatypes.STRING(1)
        },
        indProcesoEfectiva: {
            type: Datatypes.STRING(1)
        },
        indProcesoEfectivaLinea	: {
            type: Datatypes.STRING(1)
        },
        mes: {
            type: Datatypes.INTEGER(11)
        }
    }, {
        timestamps: true,
        createdAt: false,
        updatedAt: false,
        deletedAt: false,
        freezeTableName: true,
        tableName: 'sisperiodo'
    });

    return SisPeriodos

};