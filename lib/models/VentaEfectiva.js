'use strict'

module.exports = function(sequelize, Datatypes){
    var VentaEfectiva = sequelize.define('VentaEfectiva', {
        codVenta:{
            type:Datatypes.STRING(15),
            primaryKey: true
        },
        audFechaCrea:{
            type:Datatypes.DATE()
        },
        audFechaModifica:{
            type:Datatypes.DATE()
        },
        audIPCrea:{
            type:Datatypes.STRING(50)
        },
        audIPModifica:{
            type:Datatypes.STRING(50)
        },
        audPCCrea:{
            type:Datatypes.STRING(30)
        },
        audPCModifica:{
            type:Datatypes.STRING(30)
        },
        audUsuarioCrea:{
            type:Datatypes.STRING(15)
        },
        audUsuarioModifica:{
            type:Datatypes.STRING(15)
        },
        cantidad:{
            type:Datatypes.INTEGER(11)
        },
        indBloqueado:{
            type:Datatypes.STRING(1)
        },
        indEliminado:{
            type:Datatypes.STRING(1)
        },
        codJefe:{
            type:Datatypes.STRING(6)
        },
        codLinea:{
            type:Datatypes.STRING(6)
        },
        margen:{
           type:Datatypes.DECIMAL(19,2)
        },
        codPeriodo:{
            type:Datatypes.STRING(6)
        },
        precioCosto:{
            type:Datatypes.DECIMAL(19,2)
        },
        precioPVD:{
            type:Datatypes.DECIMAL(19,2)
        },
        codProducto:{
            type:Datatypes.STRING(6)
        },
        codRetail:{
            type:Datatypes.STRING(6)
        },
        codSupervisor:{
            type:Datatypes.STRING(6)
        },
        codTienda:{
            type:Datatypes.STRING(6)
        },
        totalCosto:{
            type:Datatypes.DECIMAL(19,2)
        },
        totalPVD:{
            type:Datatypes.DECIMAL(19,2)
        },
        codVendedor:{
            type:Datatypes.STRING(6)
        }
    },{
        timestamps: false,
        createdAt : false,
        updatedAt: false,
        deletedAt: false,
        freezeTableName: true,
        tableName: 'comventaefectiva'
    });

    return VentaEfectiva

};