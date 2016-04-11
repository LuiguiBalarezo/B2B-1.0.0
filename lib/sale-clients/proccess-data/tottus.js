'use strict';
//
var _ = require('underscore'),
    accounting = require('accounting'),
    math = require('mathjs'),
    Promises = require('bluebird'),
    moment = require('moment'),
    logger = require('../loggers/tottus'),
    parseFile = require('../../parseFile'),
    db = require('../../database'),
    FileDuplicateError = require('../../errors/FileDuplicateError'),
    utils = require('util'),
    splitArray,
    countrowsArrays,
    todayTimeStamp,
    cod_prod;


var indexyesterday;
var dia, mes, anio;

var workbook,
    codmaximoventaefectiva,
    codmaxtienda,
    codmaxtiendaformat,
    codretail,
    datasplit = "",
    namestore,
    tmpcodstore,
    tmpSaleperiod,
    tmpdescrip,
    descriptionstore,
    codperiod,
    codventaefectivaformat;

/*==========  Saving data to database  ==========*/
/*La variable callback hace referencia a la funcion processData(_, _, _, function(){ callback(info_sales, casperpath, cwd) })*/
module.exports = function (emitter, clientId, fileData, callback) {

    var todayTimeStamp = new Date;
    var oneDayTimeStamp = 1000 * 60 * 60 * 24;
    var diff = todayTimeStamp - oneDayTimeStamp;
    var yesterdayDate = new Date(diff);

    dia = ("0" + yesterdayDate.getDate()).slice(-2);
    mes = ("0" + (yesterdayDate.getMonth() + 1)).slice(-2);
    anio = yesterdayDate.getFullYear();
    indexyesterday = new Date(anio, mes - 1, dia);

    //
    var now = moment(),
        fileName = fileData,
        fileNameFormat = /^.*-(\d{8})\.csv$/,
        fileNameErrMsg = 'The name of sale file not match the expected format, seems like the format has changed.. Please contact your system support.';

    var dateNow = now.toDate();

    logger.info('Procesando Datos');

    todayTimeStamp = new Date;

    if (fileName.idsales != null && fileName.namesales != null && fileName.reportdata != null) {


        namestore = fileName.namesales;
        workbook = new Buffer(fileName.reportdata, 'base64').toString("ascii");
        datasplit = workbook.split(/\n/);

        db.VentaEfectiva.max('codVenta').then(function (codmaxsale) {
            codmaximoventaefectiva = codmaxsale;
            /*Obtener el id Maximo  de la tienda para su incremente mas adelante*/
            db.Tienda.max('codTienda').then(function (codmaxstore) {
                codmaxtienda = codmaxstore;
                /*Buscar el codigo del Retail a cual le pertenece el la variable clientId*/
                db.Retails.find({where: {nombre: clientId}}).then(function (result) {
                    if (result != null) {
                        codretail = result.dataValues.codRetail;

                        /* Buscar la venta efectiva MINIMA (YA QUE HABRAN VARIOS PERIODOS REGISTRADOS PERVIAMENTE PARA TODO EL AÑO),
                         * de acuerdo al codigo del retail, si venta es falso (significa que no existe ventas registradas de este retail),
                         * sequira con el flujo; en el caso que si encuentre venta efectiva minima,
                         * volvera a buscar para poder obtener la fecha de dicha venta, con el cual poder realizar una comparacion
                         * entre la fecha obtenida y la fecha de ayer para asi ya no crear las nuevas ventas, sino actualizar las ventas encontradas con la fecha de ayer
                         * en el caso que la fecha de ayer no haya pasado la fecha periodo actual*/
                        searchSaleEffective_fordateMax(codretail).then(function (saleeffective) {
                            if (saleeffective.exists) {

                                var fechaventamaxima = new Date(period.fechaventamaxima);
                                var fechaayer = new Date(anio, mes, dia);

                                /*Si la fecha de ayer es menor a la fecha de venta maxima,
                                 * se hara una busqueda de la ultima fecha del periodo perteneciente a este retail*/
                                if (fechaventamaxima < fechaayer) {
                                    /*Se comezara a buscar la ultima fecha periodo maxima de este retail*/
                                    searchPeriod(codretail).then(function (period) {
                                        if (period.exists) {

                                            codperiod = period.codPeriodo;
                                            if (fechaayer < period.fechafin) {
                                                /*Agregamos la venta efectiva modificando la fecha a la "fecha actual" de ayer*/
                                            }
                                        } else {
                                            console.log("No existe periodo registrado en la bd para " + clientId);
                                        }
                                    });

                                } else {

                                }

                            } else {
                                /* Si no existe venta con un codigo de periodo perteneciente a este retail
                                 * se tendra que obtener la ultima fecha periodo registrado previamente y obligatoriamente
                                 * en la tabla Sistperiodo para poder comprarar la fecha de ayer y las fecha fin periodo , y asi saber si es menor
                                 * a la fecha fin con lo cual poder crear un nuevo registro en venta efectiva*/
                                searchPeriod(codretail).then(function (period) {

                                    if (period.exists) {

                                        codperiod = period.codPeriodo;

                                        var fechafin = new Date(period.fechafin);
                                        var fechaayer = new Date(anio, mes - 1, dia);

                                        /* Si la fecha de ayer es menor a la fecha periodo,
                                         * se agregara una vueva venta efectiva colocando la fecha de ayer y obteniendo los registros
                                         * del reporte descargado de la fecha de ayer*/
                                        if (fechaayer < fechafin) {

                                            console.log("0 Ventas efectivas encontradas, Se comenzara a registrar a leer el reporte y registrar las ventas, REGISTROS VENTAS : " + countrowsArrays);

                                            searchstore(codretail, namestore).then(function (store) {
                                                if (store.exists) {
                                                    console.log("Existe tienda " + namestore + " almecenada en la base de datos ");

                                                    runAlfterStore(store.codstore, store.description)

                                                } else {
                                                    console.log("No existe tienda " + namestore + " almecenada en la base de datos ");
                                                    codmaxtienda++;

                                                    codmaxtiendaformat = CodFormat('000000', codmaxtienda);
                                                    db.Tienda.create({
                                                        codTienda: codmaxtiendaformat,
                                                        audFechaCrea: dateNow,
                                                        audFechaModifica: null,
                                                        audIPCrea: 'DEV_IP',
                                                        audIPModifica: null,
                                                        audPCCrea: 'DEV_PC',
                                                        audPCModifica: null,
                                                        audUsuarioCrea: 'DEV_USER',
                                                        audUsuarioModifica: null,
                                                        codRetail: codretail,
                                                        descripcion: store.description,
                                                        direccion: '',
                                                        indBloqueado: 'N',
                                                        indEliminado: 'N'
                                                    }).then(function (createtienda) {



                                                    });
                                                }
                                            });

                                        } else {
                                            /*El flijo no deberia pasar por aqui, ya que solo es cuando no existen ventas efectivas previamente registradas de este retail*/
                                        }

                                    } else {
                                        console.log("No existe periodo registrado en la bd para " + clientId);
                                    }
                                });
                            }
                        })

                    }

                });
            });

        });

        //
        //
        //    console.log(getNameRetail(countrowsArrays));
        //
        //    readDescriptionProducts(function () {
        //        //
        //        callback();
        //    });

    } else {
        console.log("NULO " + fileName.reportdata);

        callback();
    }


    //logger.info('Checking sale file existence..');

};

function searchPeriodByCodPeriod(codperiodo) {
    return db.SisPeriodos.find({
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
                codPeriodo: result.dataValues.codPeriodo,
                fechafin: result.dataValues.fechaFin
            }
            return object;
        }
    });
}

function runAlfterStore(cod, descrip) {
    tmpcodstore = cod;
    descriptionstore = descrip;

    /*Aqui se comienza a agregar las ventas efectivas*/


    readDescriptionProducts(datasplit, function () {

        callback();
    }).then(function (products) {

        products.forEach(function (productssale) {

            tmpSaleperiod = productssale.saleproduct;
            tmpdescrip = productssale.nameproduct;

            (function (saleperiod, descripproduct, codstore) {

                searchProductRetail(codretail, descripproduct).then(function (productretail) {
                    if (productretail.exists) {
                        if (productretail.codEq == null) {
                            console.log("PRODUCTO CON EQUIVALENCIA NULL " + productretail.nameProduct + " " + saleperiod);
                        } else {
                            searchProduct(productretail.codEq).then(function (product) {
                                if (product.idprod == null || product.idprod == '') {
                                    console.log("PRODUCTO SIN IDE " + productretail.codEq + " " + product.idprod + " " + product.descrip);
                                } else {
                                    console.log("PRODUCTO CON ID " + productretail.codEq + " " + product.idprod + " " + product.descrip);

                                    searchSaleeffective(codretail, codstore, product.idprod, product.idline, product.price, product.pvd, codperiod).then(function (saleeffective) {
                                        if (saleeffective.exists) {
                                            db.VentaEfectiva.update({
                                                precioCosto: saleeffective.price,
                                                PrecioPVD: saleeffective.pvd,
                                                cantidad: parseInt(saleperiod),
                                                audFechaModifica: dateNow
                                            }, {
                                                where: {
                                                    codVenta: saleeffective.codSale
                                                }
                                            }).then(function (updateventaefectiva) {
                                                console.log("PRODUCTO ACTUALIZADO ++++++ : " + updateventaefectiva[0]);
                                                //
                                            })
                                        } else {

                                            console.log(" > || " + saleperiod + " " + saleeffective.price + " " + saleeffective.pvd + " " + saleeffective.idProd + " " + codstore + " " + saleeffective.codRetail);

                                            codmaximoventaefectiva++;
                                            codventaefectivaformat = CodFormat('000000000000000', codmaximoventaefectiva);

                                            var now = moment();
                                            var dateNow = now.toDate();

                                            db.VentaEfectiva.create({
                                                codVenta: codventaefectivaformat,
                                                audFechaCrea: dateNow,
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
                                                console.log("PRODUCTO CREADO ++++++ : " + createventaefectiva.dataValues.codProducto);
                                                //
                                            })
                                        }
                                    })
                                }
                            });
                        }
                    } else {
                        console.log("No existe Producto " + descripproduct + " almecenada en la tabla Productos_retail");
                    }
                });
            })(tmpSaleperiod, tmpdescrip, tmpcodstore)

        });
    });

}


function searchProduct(codeq) {
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

function searchProductRetail(codretail, description) {
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
                nameProduct: description

            }
            return object;
        } else {
            object = {
                exists: true,
                codEq: products.dataValues.codEq,
                nameProduct: description
            }
            return object;
        }

    })
}


function searchPeriod(codretail) {

    return db.SisPeriodos.min('codPeriodo', {
        where: {
            codRetail: codretail,
            indProcesoEfectiva: 'N'
        }
    }).then(function (result) {
        var object = {};
        if (result == null) {
            object = {
                exists: false
            }
            return object;
        } else {

            var codperiodo = result;

            return db.SisPeriodos.find({
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
                        codPeriodo: result.dataValues.codPeriodo,
                        fechafin: result.dataValues.fechaFin
                    }
                    return object;
                }
            });
        }
    });

}

function searchSaleEffective_fordateMax(codretail) {
    return db.VentaEfectiva.max('codVenta', {
        where: {
            codRetail: codretail
        }
    }).then(function (result) {
        var object = {};
        if (result == null) {
            object = {
                exists: false
            }
            return object;
        } else {

            var codventa = result;

            return db.VentaEfectiva.find({
                where: {
                    codVenta: codventa
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
                        fechaventamaxima: result.dataValues.audFechaCrea
                    }
                    return object;
                }
            })
        }
    })
}

function searchSaleeffective(codretail, codstore, idprod, idline, price, pvd, codperiod) {

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

function readDescriptionProducts(data, callback) {


    return new Promises(function (resolve, reject) {


        var indexrowrange = 1; //Rango inicial para la lectura del data separados por array
        var row = '', rowsplit = '';
        var valuetopush = {}, totalinfosales = [];
        /*Obtendremos las fecha de ayer de acuerdo al metodo getRangeDay();*/
        var rangeyesterday = getRangeDay();

        /*Eliminar los ultimos 5 registros de todo el array, ya que no son datos de utlidad*/
        data.splice(data.length - 5, data.length);

        /*Obtenemosy colocamos en un objecto las descripcion del producto vendido mas la cantidad vendida*/
        for (var i = 0; i < data.length; i++) {
            valuetopush = {};
            if (indexrowrange < data.length) {
                row = data[indexrowrange];
                /*Separando todo el row, para obtener la descripcion del producto y la venta segun la fecha de ayer
                 * luego sumando el rango de busqueda*/
                rowsplit = row.split(',');
                valuetopush.nameproduct = rowsplit[0];
                valuetopush.saleproduct = rowsplit[rangeyesterday];

                totalinfosales.push(valuetopush);

                indexrowrange += 3;
            }
        }
        if (totalinfosales.length > 0) {
            resolve(totalinfosales);

            callback();
        }
    });


//    getLeerRango();

    //for (var i = 0; i < sales; i++) {
//        count_reg++;

    //console.log("Totales Registros: " + count_reg);
//
//        if(nameretail != "%"){
//            //
//            //console.log(nameretail);
//            if(getAct(i) == "V.ANT"){
//                sku = getsku(indexsku);
//            }else{
//                sku = sku;
//            }
//
//            if(getPorcentage(i) == "%"){
//                cod_prod = getCodProd(indexcodProd);
//            }else{
//                cod_prod = cod_prod;
//            }
//
//            if (getAct(i) == "V.ACT") {
//
//                //db.Ventas.create({
//                //    codigo_sku: sku,
//                //    codigo_empresa: '05',
//                //    nombre_empresa: 'TOTTUS',
//                //    nombre_local: nameretail,
//                //    cod_prod: cod_prod,
//                //    descripcion_producto: getNameProduct(i),
//                //    venta_periodo_soles: '',
//                //    venta_periodo_neto_soles: '',
//                //    venta_periodo_unidad: getSaleUnit(i),
//                //    fecha_venta: anio+ "-"+ mes + "-" + dia
//                //
//                //}).then(function () {
//                //
//                //});
//
//                //
//
//                console.log(anio+ "-"+ mes + "-" + dia + " / " + getSaleUnit(i));
//
//                indexsku++;
//                indexcodProd++;
//            }else{
//                indexsku++;
//                indexcodProd++;
//            }
//        }
//    }
//
//    indexsku = 0;
//    indexcodProd=0;
//    count_reg = 0;
//    callback();
//
}

function searchstore(cod_retail, nombretienda) {
    return db.Tienda.find({
        where: {
            codRetail: cod_retail,
            descripcion: nombretienda
        }
    }).then(function (result) {
        var object = {};
        if (result == null) {
            object = {
                exists: false,
                description: nombretienda
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
    var days = new Array("Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado");
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

    return nameyesterday;
}

//
function getNameRetail(index) {

    var row = splitArray[index - 5];
    var arrays = row.split(',');
    return arrays[1];
}
//
//function getAct(index) {
//    var row = splitArray[index];
//    var arrays = row.split(',');
//    return arrays[1];
//}
//
//function getPorcentage(index){
//    var row = splitArray[index];
//    var arrays = row.split(',');
//    return arrays[1];
//}
//
//function getNameProduct(index) {
//    var row = splitArray[index];
//    var arrays = row.split(',');
//    return arrays[0];
//    //
//}
//
//function getSaleUnit(index) {
//    var row = splitArray[index];
//    var arrays = row.split(',');
//    return arrays[indexFechaVentaInidad];
//}
//
//function getsku(index) {
//    var row = splitArray[index];
//    var arrays = row.split(',');
//    return arrays[0];
//}
//
//function getCodProd(index){
//    var row = splitArray[index];
//    var arrays = row.split(',');
//    return arrays[0];
//}