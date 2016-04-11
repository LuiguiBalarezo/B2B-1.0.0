'use strict'

module.exports = function(sequelize, Datatypes){
    var Ventas = sequelize.define('Ventas', {

        codigo_sku:{
            type:Datatypes.STRING(15)
        },
        codigo_empresa:{
            type:Datatypes.STRING(15)
        },
        nombre_empresa:{
            type:Datatypes.STRING(30)
        },
        nombre_local:{
            type:Datatypes.STRING(30)
        },
        cod_prod:{
            type:Datatypes.STRING(10)
        },
        descripcion_producto:{
            type:Datatypes.STRING(255)
        },
        venta_periodo_soles:{
            type:Datatypes.DECIMAL(10, 2)
        },
        venta_periodo_neto_soles:{
            type:Datatypes.DECIMAL(10, 2)
        },
        venta_periodo_unidad:{
            type:Datatypes.INTEGER(11)
        },
        fecha_venta: {
            type: 'Date'
        },
        fecha_desde:{
            type: 'Date'
        },
        fecha_hasta:{
            type: 'Date'
        }
    },{
        timestamps: true,
        createdAt : false,
        updatedAt: false,
        deletedAt: false,
        freezeTableName: true,
        tableName: 'ventas'
    });

    return Ventas

};