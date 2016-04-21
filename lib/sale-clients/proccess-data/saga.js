'use strict';
var _ = require('underscore'),
    accounting = require('accounting'),
    math = require('mathjs'),
    Promises = require('bluebird'),
    utilRead = require('../../utilRead'),
    //utilRead = require('../../utilReadFile'),
    moment = require('moment'),
    logger = require('../loggers/saga'),
    db = require('../../database'),
    utils = require('util'),
    todayTimeStamp,
    cod_prod;

var indexyesterday;
var dia, mes, anio;

var workbook,
    codmaxsaleeffective,
    codmaxstore,
    codmaxstoreformat,
    codretail,
    datasplit = "",
    namestore,
    tmpcodstore,
    tmpSaleperiod,
    tmpdescrip,
    descriptionstore,
    codperiod,
    codventaefectivaformat,
    fechaayer,
    countProductsRead = 0,
    rangeyesterday,
    nameretail;

var productosnotfound = [], productoseqfound = [], productoseqnotfound = [];

/*==========  Saving data to database  ==========*/
module.exports = function (emitter, clientId, fileData, countprocess, callback) {


    var todayTimeStamp = new Date;
    var oneDayTimeStamp = 1000 * 60 * 60 * 24;
    var diff = todayTimeStamp - oneDayTimeStamp;
    var yesterdayDate = new Date(diff);
    dia = ("0" + yesterdayDate.getDate()).slice(-2);
    mes = ("0" + (yesterdayDate.getMonth() + 1)).slice(-2);
    anio = yesterdayDate.getFullYear();
    indexyesterday = new Date(anio, mes - 1, dia);

    var now = moment(),
        fileName = fileData,
        fileNameFormat = /^.*-(\d{8})\.csv$/,
        fileNameErrMsg = 'The name of sale file not match the expected format, seems like the format has changed.. Please contact your system support.';

    logger.info('Procesando Datos');


    todayTimeStamp = new Date;

    if (fileName.reportdata != null && fileName.idsales != undefined && fileName.namesales != null && fileName.namesales != undefined && fileName.reportdata != null) {

        namestore = fileName.namesales;
        workbook = new Buffer(fileName.reportdata, 'base64').toString("binary");
        datasplit = workbook.split(/\n/);

        utilRead.getCodMaxSaleEffective().then(function (cod) {
            return null;
        }).then(function () {
            /*seccion donde se buscaria periodo por mes y año*/
            return null
        }).then(function () {
            /*Seccion donde se pide el codigo de el retail*/
            return utilRead.getInfoRetailByName(clientId);
        }).then(function (retail) {
            /** Seccion donde se obtiene obtiene info de retail*/
            if (retail.exists) {
                codretail = retail.codretail;
                nameretail = retail.nameretail;
                return null;
            } else {
                console.log("No existe el retail " + retail.nameretail + " registrado en la base de datos!!!.");
            }
        }).then(function () {
            /**Buscar el periodo minimo con el proceso N, para poder determinar cual es el periodo mas reciente
             * para procesar*/
            searchPeriodMin(codretail).then(function (period) {
                if (period.exists) {
                    codperiod = period.codperiod;
                    fechaayer = new Date(anio, mes - 1, dia);
                    /**Buscar si existe alguna venta efectiva que pertenezca al ultimo periodo encontrado
                     * con el cual determinar si se necesitara crear uno, en el caso que no existe, y en caso que existe se tendra que modificar
                     * dichas ventas con las fecha de ayer y las venta unidad*/
                    debugger;
                    searchSaleEffectivePeriod(codperiod, codretail).then(function (saleinfo) {
                        if (saleinfo.exists) {
                            /**Buscar por codperiodo , cual es la fecha fin de dicho periodo, para poder hacer una comparacion
                             * de fechas, entre la fecha de ayer y la fecha fin */
                            debugger;

                            searchPeriodByCodPeriod(saleinfo.codperiod).then(function (periodinfo) {

                                var codPeriodActual = periodinfo.codperiod;
                                var fechafinperiod = new Date(periodinfo.fechafin);

                                var dia_ayer = fechaayer.getDay();
                                var mes_ayer = fechaayer.getMonth();
                                var anio_ayer = fechaayer.getFullYear();
                                var fecha_ayer_format = dia_ayer + "-" + mes_ayer + "-" + anio_ayer;


                                var dia_periodo = moment(fechafinperiod).date();
                                var mes_periodo = moment(fechafinperiod).month() + 1;
                                var anio_periodo = moment(fechafinperiod).year();

                                var fecha_fin_periodo_format = dia_periodo + "-" + mes_periodo + "-" + anio_periodo;

                                /**Si fecha de ayer es menor a fecha periodo, Actualizar todas las ventas efectivas las cuales
                                 * tienen el IDPERIODO ACTUAL*/
                                if (fecha_ayer_format < fecha_fin_periodo_format) {
                                    /**Buscara si la tienda actiual existe, en el caso no exista creara una nueva tienda con sus
                                     * datos especificados y devolvera informacion"*/
                                    searchstore(codretail, namestore).then(function (storeinfo) {
                                        /**Lee el reporte de productos y los envia formateados en un Json para poder ser
                                         * leidos mediante un FoEach()*/
                                        readDescriptionProducts(datasplit).then(function (products) {
                                            /**LECTURA DE LOS DATOS FORMATEADOS DEL REPORTE*/
                                            readProducts(products, function () {
                                                callback();
                                            });

                                        });
                                    })
                                } else if (fecha_ayer_format == fecha_fin_periodo_format) {
                                    /**SI ES IGUAL actualizar todos los registros de venta efectiva los cuales tienen el ID PERIODO ACTUAL
                                     * Y al terminar de de actualizar todas las ventas tambien modificara el estado de proceso del
                                     * periodo de N a S*/



                                    searchstore(codretail, namestore).then(function (storeinfo) {
                                        /**Lee el reporte de productos y los envia formateados en un Json para poder ser
                                         * leidos mediante un FoEach()*/
                                        readDescriptionProducts(datasplit).then(function (products) {
                                            /** Cuando la fecha de ayer es igual a la fecha periodo final, significa que dicho periodo tiene que
                                             * cambiar su estado  S que significa que ya fue procesado */
                                            if (countprocess <= 1) {
                                                periodoFinish(codperiod);
                                            }
                                            /**LECTURA DE LOS DATOS FORMATEADOS DEL REPORTE*/
                                            readProducts(products, function () {
                                                callback();
                                            });
                                        });
                                    })
                                }
                            })

                        } else {

                            debugger;
                            /**Si la tienda actual existe, buscara; en el caso no exista creara una nueva tienda con sus
                             * datos especificados y devolvera la informacion en un json*/
                            searchstore(codretail, namestore).then(function (storeinfo) {
                                if (storeinfo.exists) {

                                    tmpcodstore = storeinfo.codstore;
                                    /**Lee el reporte de productos y los envia formateados en un Json para poder ser
                                     * leidos mediante un FoEach()*/
                                    readDescriptionProducts(datasplit, tmpcodstore).then(function (products) {
                                        /**LECTURA DE LOS DATOS FORMATEADOS DEL REPORTE*/
                                        readProducts(products, function () {
                                            callback();
                                        });

                                    });
                                } else {
                                    console.log("TIENDA NO EXISTE " + storeinfo.description);
                                }
                            })
                        }
                    });

                } else {
                    console.log("No Existe periodos sin procesar (N), para poder ser usados en la lectura y registro del proceso de registro de ventas fectivas")
                }

            });
        })


    } else {
        console.log("NULO " + fileName.reportdata);
        callback();
    }

    logger.info('Checking sale file existence..');
};

function searchPeriodByCodPeriod(codperiodo) {
    console.log("*** searchPeriodByCodPeriod: where codPeriod:" + codperiodo);
    return db.PeriodosMesComercial.find({
        where: {
            codPeriodo: codperiodo
        }
    }).then(function (result) {
        var object = {}
        if (result == null) {
            object = {
                exists: false
            }
            return object;
        } else {
            object = {
                exists: true,
                codperiod: result.dataValues.codPeriodo,
                fechainicio: result.dataValues.fechaInicioMesComercial,
                fechafin: result.dataValues.fechaFinalMesComercial
            }
            return object;
        }
    });
}


function searchProduct(codeq) {
    console.log("*** searchProduct: where codEq:" + codeq);
    return db.Productos.find({
        where: {
            id: codeq
        }
    }).then(function (product) {
        var object = {};
        if (product == null) {
            object = {
                exists: false
            }
            return object;
        } else {
            object = {
                exists: true,
                idprod: product.dataValues.id,
                codprod: product.dataValues.codigo,
                descrip: product.dataValues.descripcion,
                idline: product.dataValues.id_linea,
                price: product.dataValues.precio_costo,
                pvd: product.dataValues.pvd
            }
            return object;
        }
    })
}

function periodoFinish(cod) {
    return db.SisPeriodos.update({
        indProcesoEfectiva: "S"
    }, {
        where: {
            codPeriodo: cod
        }
    }).then(function (updateperiod) {
        return updateperiod;
    })
}

function searchProductRetail(codretail, description) {
    countProductsRead++;
    console.log("*//* searchProductRetail: where codRetail:" + codretail + " Descricion Products:" + description + " -- N°: " + countProductsRead);
    return db.Productos_retails.find({
        where: {
            descripcion: description,
            codRetail: codretail
        }
    }).then(function (products) {
        var object = {};
        if (products == null) {
            object = {
                exists: false,
                codEq: null,
                nameProduct: description
            }
            productoseqfound.push(description);
            return object;
        } else {
            object = {
                exists: true,
                codEq: products.dataValues.codEq,
                nameProduct: description
            }
            productoseqnotfound.push(products.dataValues.descripcion);
            return object;
        }
    })
}

function searchPeriodMin(codretail) {
    console.log("*** searchPeriodMin: where codRetail:" + codretail + " Proceso: N");
    return db.PeriodosMesComercial.min('codPeriodo', {
        where: {
            codRetail: codretail,
            procesado: 'N'
        }
    }).then(function (result) {
        var object = {};
        if (result == null) {
            object = {
                exists: false
            }
            return object;
        } else {
            object = {
                exists: true,
                codperiod: result
            }
            return object;
        }
    });
}

function searchSaleEffectivePeriod(codperiod, codretail) {
    console.log("*** searchSaleEffectivePeriod: where codPeriod:" + codperiod + " codRetail:" + codretail);
    return db.VentaEfectiva.findAll({
        where: {
            codPeriodo: codperiod,
            codRetail: codretail
        }
    }).then(function (count) {
        var object = {};
        if (count < 1) {
            object = {
                exists: false,
                codperiod: codperiod
            }
            return object;
        } else {
            object = {
                exists: true,
                codperiod: codperiod
            }
            return object;
        }
    })
}

function searchSaleeffective(codretail, codstore, idprod, idline, price, pvd, codperiod) {
    console.log("*** searchSaleeffective: where codRetail:" + codperiod + " codStore:" + codretail + " idProd: " + idprod + " idLine: " + idline + " price: " + price + " pvd: " + pvd + " codPeriod:" + codperiod);
    return db.VentaEfectiva.find({
        where: {
            codRetail: codretail,
            codTienda: codstore,
            codProducto: idprod,
            codPeriodo: codperiod
        }
    }).then(function (result) {

        var object = {};
        if (result == null) {
            object = {
                exists: false,
                codStore: codstore,
                idProd: idprod,
                idLine: idline,
                price: price,
                pvd: pvd,
                codRetail: codretail,
                codPeriod: codperiod
            }

            return object;
        } else {
            object = {
                exists: true,
                codSale: result.dataValues.codVenta,
                codStore: codstore,
                idProd: idprod,
                idLine: idline,
                price: price,
                pvd: pvd,
                codRetail: codretail,
                codPeriod: codperiod
            }

            return object;
        }
    })
}

function CodFormat(format, cod) {
    var countformat = format.length;
    return (format + cod).slice(-countformat);
}

function readDescriptionProducts(data, codstore) {
    return new Promises(function (resolve, reject) {
        var countProductosRead = 0;
        var indexrowrange = 1; //Rango inicial para la lectura del data separados por array
        var indexrangecleanproductos = 1;

        var row = '', rowsplit = '';
        var valuetopush = {}, totalinfosales = [];
        /**Obtendremos las fecha de ayer de acuerdo al metodo getRangeDay();*/
        rangeyesterday = getRangeDay();
        /**Eliminar los ultimos 5 registros de todo el array, ya que no son datos de utlidad*/
        data.splice(data.length - 9, data.length);
        /**por el problema que existe sobre la repeticion de productos en el reporte de ventas
         * se tendra que hacer un filtro y solo guardar uno de todos los repetidos*/
        var descr_product = '', nameproducts = [];
        /**Obtenemosy colocamos en un objecto las descripcion del producto vendido mas la cantidad vendida*/
        for (var i = 0; i < data.length; i++) {
            valuetopush = {};
            if (indexrowrange < data.length) {
                row = data[indexrowrange];
                /**Separando todo el row, para obtener la descripcion del producto y la venta segun la fecha de ayer
                 * luego sumando el rango de busqueda*/
                rowsplit = row.split(',');
                /** Porder indentificar las descripcion de productos repetidos,
                 * si en el array "nameproducts" se encuentra la misma descripcion del producto leido anteriormente, no guardara
                 * y seguira con el aumento del rando y asi poder continuar leyendo el rowsplit*/
                descr_product = rowsplit[0];
                countProductosRead++;
                if (nameproducts.indexOf(descr_product) == -1) {
                    nameproducts.push(descr_product);
                    valuetopush.nameproducts = rowsplit[0];
                    valuetopush.saleproducts = rowsplit[rangeyesterday];
                    valuetopush.codstore = codstore;
                    //console.log("***/ Nombre Producto:" + rowsplit[0] + " Venta: " + rowsplit[rangeyesterday] + " N°: " + countProductosRead);
                    totalinfosales.push(valuetopush);
                } else {
                    //console.log(descr_product + " Venta: " + rowsplit[rangeyesterday] + " | encontrado en fila > " + nameproducts.indexOf(descr_product) + " N°: " + countProductosRead);
                }
                indexrowrange += 3;
            }
        }

        if (totalinfosales.length > 0) {
            resolve(totalinfosales);
        }
    });
}

function readProducts(sales, callback) {
    debugger;

    console.log("*** readProducts: where codProducts:" + sales.length);
    utilRead.processProductsAndSale_Estilos(sales).then(function (products) {
        utilRead.proccessProducts(codretail, codperiod, products).then(function () {
            callback();
        });
    });


}

function saleEffectiveCreate(codstore, codmax, saleperiod, saleeffective) {
    console.log("*** saleEffectiveCreate: data codStore:" + codstore + " codMax:" + codmax + " salePeriod: " + saleperiod + " saleEffective: " + saleeffective);
    return db.VentaEfectiva.create({
        codVenta: CodFormat('000000000000000', codmax),
        audFechaCrea: fechaayer,
        audFechaModifica: null,
        audIPCrea: "DEV_IP",
        audIPModifica: null,
        audPCCrea: "DEV_PC",
        audPCModifica: null,
        audUsuarioCrea: "DEV_USER",
        audUsuarioModifica: null,
        cantidad: parseInt(saleperiod),
        indBloqueado: "N",
        indEliminado: "N",
        codJefe: null,
        codLinea: saleeffective.idLine,
        margen: parseFloat("0.00"),
        codPeriodo: codperiod,
        precioCosto: saleeffective.price,
        precioPVD: saleeffective.pvd,
        codProducto: saleeffective.idProd,
        codRetail: saleeffective.codRetail,
        codSupervisor: null,
        codTienda: codstore,
        totalCosto: parseFloat("0.00"),
        totalPVD: parseFloat("0.00"),
        codVendedor: null
    }).then(function (createventaefectiva) {
        return createventaefectiva;
    })
}

function saleEffectiveUpdate(saleeffective, saleperiod) {
    console.log("*** saleEffectiveUpdate: where saleEffective:" + saleeffective + " salePeriod:" + saleperiod);

    return db.VentaEfectiva.update({
        precioCosto: saleeffective.price,
        PrecioPVD: saleeffective.pvd,
        cantidad: parseInt(saleperiod),
        audFechaCrea: fechaayer,
        audFechaModifica: fechaayer
    }, {
        where: {
            codVenta: saleeffective.codSale
        }
    }).then(function (updateventaefectiva) {
        return updateventaefectiva;
    })
}

function searchstore(codretail, namestore) {
    console.log("*** searchstore: where codRetail:" + codretail + " nameStore:" + namestore);

    return db.Tienda.find({
        where: {
            codRetail: codretail,
            descripcion: namestore
        }
    }).then(function (result) {
        var object = {};
        if (result == null) {

            ///**Obtener el id Maximo  de la tienda para su incremente mas adelante*/
            //return db.Tienda.max('codTienda').then(function (codmaxstore) {
            //
            //    var now = moment();
            //    var dateNow = now.toDate();
            //
            //    codmaxstore++;
            //
            //    return db.Tienda.create({
            //        codTienda: CodFormat('000000', codmaxstore),
            //        audFechaCrea: dateNow,
            //        audFechaModifica: null,
            //        audIPCrea: 'DEV_IP',
            //        audIPModifica: null,
            //        audPCCrea: 'DEV_PC',
            //        audPCModifica: null,
            //        audUsuarioCrea: 'DEV_USER',
            //        audUsuarioModifica: null,
            //        codRetail: codretail,
            //        descripcion: namestore,
            //        direccion: '',
            //        indBloqueado: 'N',
            //        indEliminado: 'N'
            //    }).then(function (createstore) {
            //
            //        object = {
            //            exists: false,
            //            create: true,
            //            codstore: createstore.dataValues.codTienda,
            //            description: createstore.dataValues.descripcion
            //        }
            //
            //        return object;
            //
            //    });
            //});

            object = {
                exists: false,
                codstore: null,
                description: namestore
            }

            return object;
        } else {
            object = {
                exists: true,
                codstore: result.dataValues.codTienda,
                description: result.dataValues.descripcion
            }
            return object;
        }
    })
}

function getRangeDay() {
    var days = new Array("Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado");
    var nameyesterday = '';

    switch (days[indexyesterday.getDay()]) {
        case "Lunes":
            nameyesterday = 2;
            break;
        case "Martes":
            nameyesterday = 3;
            break;
        case "Miercoles":
            nameyesterday = 4;
            break;
        case "Jueves":
            nameyesterday = 5;
            break;
        case "Viernes":
            nameyesterday = 6;
            break;
        case "Sabado":
            nameyesterday = 7;
            break;
        case "Domingo":
            nameyesterday = 8;
            break;
    }

    console.log("*** getRangeDay: " + days[indexyesterday.getDay()] + " " + nameyesterday);
    return nameyesterday;
}
