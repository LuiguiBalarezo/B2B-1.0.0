'use strict'

module.exports = function(sequelize, Datatypes){
    var Linea = sequelize.define('Linea', {
        codLinea:{
            type:Datatypes.STRING(6),
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
        descripcion: {
            type:Datatypes.STRING(200)
        },
        indBloqueado:{
            type:Datatypes.STRING(1)
        },
        indEliminado:{
            type:Datatypes.STRING(1)
        },
        nombre:{
            type:Datatypes.STRING(100)
        },
        linea_id:{
            type:Datatypes.STRING(4)
        }
    },{
        timestamps: false,
        createdAt : false,
        updatedAt: false,
        deletedAt: false,
        freezeTableName: true,
        tableName: 'comlinea'
    });

    return Linea

};