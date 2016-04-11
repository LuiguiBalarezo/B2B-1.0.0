'use strict';

var util = require('util'),
    Promises = require('bluebird'),
    math = require('mathjs'),
    moment = require('moment'),
    XLSX = require('xlsx'),
    utils = require('../../utils'),
    logger = require('../loggers/estilos'),
    db = require('../../database');


var workbook,
    sheets = [],
    worksheets,
    cod_oechsle,
    products = [],
    retail,
    nameretail,
    todayTimeStamp;

var codretail,
    descripcion,
    tmpSaleperiod,
    tmpdescrip,
    codmaxsaleeffective,
    codmaxstore,
    codventaefectivaformat,
    codmaxstoreformat,
    tmpcodstore,
    descriptionstore,
    codperiod,
    codmaxproductsretail;

var storenamearrays = [],
    newobjectkeyarrays = [],
    name = "", pruebaequivalencia = {}, productsarrays = [], allproductsstores = [], salesproductsarrays = [],
    name_sheet = "", countproducts = 0;

function generateError() {
    var args = [].slice.call(arguments);
    return new Error(util.format.apply(util, args));
}

var obj = {};


module.exports = function (emitter, clientId, fieldMapInfile, fileData) {
    var now = moment(),
        absolutePathToFile = fileData.absolutePath,
        fileName = fileData.fileName,
        fileNameFormat = new RegExp('^' + clientId + '.*\\.xlsx$', 'i'),
        fecha_des_has = fileName.split("_"),
        fecha_periodo = fecha_des_has[1],
        fecha_periodo_split = fecha_periodo.split("."),
        fecha_periodo_final = fecha_periodo_split[0],
        fecha = fecha_periodo_final.split("-"),
        dia = fecha[0],
        mes = fecha[1],
        anio = fecha[2],
        fileNameErrMsg = 'The evaluated file (' + fileName + ') does not match with the expected format.',
        log;

    logger.info('Checking file name format..');

    todayTimeStamp = new Date;

    var dateNow = now.toDate();

    if (!fileNameFormat.test(fileName)) {
        logger.info('File name format is wrong!, fileName: %s', fileName);
        return emitter.emit('error', new Error(fileNameErrMsg));
    }

    logger.info('Register new sale file log..');

    log = {
        codB2B: clientId,
        fileName: fileName,
        // dont have a url, because is processed from file system
        downloadUrl: '',
        downloadedAt: now.toDate()
    };


    workbook = XLSX.readFile(absolutePathToFile);
    /*Lee el excel alamcenando el contenido de cada hoja*/
    readfile();
    if (countDataFile() > 0) {
        saleEffectiveMax().then(function (codmaxsale) {
            codmaxsaleeffective = codmaxsale.codmax;
            return storeCodMax();
        }).then(function (codmaxsto) {
            codmaxstore = codmaxsto.codmax;
            return productsRetailMax();
        }).then(function (codmax) {
            codmaxproductsretail = codmax.codmax;
            return searchPeriod(dia, mes, anio);
        }).then(function (periodinfo) {
            codperiod = periodinfo.codperiod;
            if (periodinfo.exists) {
                searchRetialByName(clientId).then(function (retailinfo) {
                    if (retailinfo.exists) {

                        codretail = retailinfo.codretail;
                        nameretail = retailinfo.nameretail;
                        debugger;

                        sheets.forEach(function (name_sheet) {
                            /**REALIZA EL PROCESAMIENTO PARA FORMATEAR LOS NOMBRESS DE LAS TIENDAS ENVIADOLAS EN UN ARRAY; QUE SE ENUENTRAS EN COLUMNAS, MAS NO ES HOJAS
                             * COMO EL FORMATO COMUN.*/
                            processStore(name_sheet).then(function (resultstores) {
                                resultstores.forEach(function (namestore) {
                                    searchstore(codretail, namestore).then(function (storeinfo) {
                                        if (storeinfo.exists) {
                                            runReadProducts(storeinfo.codstore, storeinfo.description, name_sheet);
                                        } else {
                                            codmaxstore++;
                                            storeCreate(codmaxstore, storeinfo.description).then(function (storeinfo) {
                                                runReadProducts(storeinfo.codstore, storeinfo.description, name_sheet);
                                            });
                                        }
                                    })
                                });
                            });
                        });

                    } else {
                        console.log("NO EXISTE RETAIL " + retailinfo.nameretail)
                    }
                });
            } else {
                console.log("NO EXISTE PERIODO " + dia + "-" + mes + "-" + anio);
            }
        })
    }

    function recollectallproductsstore(sheet) {
        return new Promises(function (resolve, reject) {

            var CONTARPRODUCTOS = 0;
            var saleinfoobject = {};
            var tmpproducts = "";
            var descriptionproducts = "";
            var products = [];

            sheet.forEach(function (namesheet) {

                tmpproducts = XLSX.utils.sheet_to_json(workbook.Sheets[namesheet]);

                tmpproducts.forEach(function (saleinfo) {
                    CONTARPRODUCTOS++;
                    descriptionproducts = saleinfo["Descripcion"];
                    if (products.indexOf(descriptionproducts) == -1) {
                        products.push(descriptionproducts);
                        console.log("nuevo producto: " + descriptionproducts);
                    } else {
                        console.log("existe producto: " + descriptionproducts);
                    }
                });
                console.log("total productos: " + CONTARPRODUCTOS);
            });
            resolve(products);
        })
    }

    //function processProducts(products) {
    //    return Promises.resolve(products).each(function (descriptionproduct) {
    //        console.log("Descripcion productos recollect : " + descriptionproduct);
    //        /** Buscara el codigo del producto en la tabla de productos oxford, con la descripcion desfragmentando palabra por palabra*/
    //        return searchCodeForString(descriptionproduct).then(function (codproductforstring) {
    //            return codproductforstring;
    //        }).then(function (codproductforstring) {
    //            return existProduct(codproductforstring, codretail);
    //        }).then(function (data) {
    //            if (!data.exists) {
    //                codmaxproductsretail++;
    //                console.log("NO EXISTE PRODUCTO: " + data.description + " " + codretail);
    //                productsRetailsCreate(codmaxproductsretail, codretail, data).then(function (productcreate) {
    //                    console.log("PRODUCTO CREADO: " + productcreate);
    //                    //return productcreate;
    //                });
    //            } else {
    //                productsRetailsUpdate(codretail, data).then(function (productupdate) {
    //                    console.log("PRODUCTO ACTUALIZADO: " + productupdate);
    //                    //return productupdate;
    //                });
    //            }
    //        });
    //    }).then(function () {
    //        debugger;
    //        return true;
    //    });
    //}


    function searchCodeForString(decriptionproduct) {
        var products_split = "";
        var object = {};
        return new Promises(function (resolve, reject) {

            products_split = decriptionproduct.split(' ');

            object = {
                codigo: null,
                descrip: decriptionproduct,
                exists_cod_Eq: false,
                id: null,
                palabra: null
            };

            for (var i = 0; i < products_split.length; i++) {
                /*Si NO EXISTE , ES NULL, O VACIO*/
                if (!!products_split[i]) {

                    searchProductSplitString(products_split[i], decriptionproduct, i + 1).then(function (product) {
                        if (product.exists_cod_Eq) {
                            object = {
                                codigo: product.codigo,
                                descrip: product.descrip,
                                exists_cod_Eq: product.exists_cod_Eq,
                                id: product.id,
                                palabra: product.palabra
                            }
                        }
                        if (product.countstring == product.countstringtotal) {
                            resolve(object);
                        }
                    });
                }
            }
        });
    }

    function readfile() {
        sheets = [];
        workbook.SheetNames.forEach(function (sheetName) {
            sheets.push(sheetName.trim());
        })
    }

    function readAfterStore(namesheet, eqstore) {

        return new Promises(function (resolve, reject) {
            var infosales = XLSX.utils.sheet_to_json(workbook.Sheets[namesheet]);

            var CONTARPRODUCTOS = 0;
            var saleinfoobject = {};
            var ventas = [];
            var indexproductssale = "";
            var objectsale = {};
            var nameproductssale = "";
            var saleproductsnew = "";
            var saleproductsold = "";
            productsarrays = [];
            infosales.forEach(function (saleinfo) {
                objectsale = {};
                CONTARPRODUCTOS++;
                console.log(CONTARPRODUCTOS);
                saleinfoobject = {};
                nameproductssale = saleinfo["Descripcion"];
                saleproductsnew = saleinfo[eqstore];

                if (productsarrays.indexOf(nameproductssale) == -1) {
                    productsarrays.push(nameproductssale);
                    //salesproductsarrays.push(saleinfoobject.saleproducts);
                    saleinfoobject.nameproducts = nameproductssale;
                    saleinfoobject.saleproducts = saleproductsnew;
                    ventas.push(saleinfoobject);
                    //console.log("productos nuevo  | " + saleinfoobject.nameproducts);
                } else {
                    indexproductssale = productsarrays.indexOf(nameproductssale);
                    objectsale.nameproducts = ventas[indexproductssale].nameproducts;
                    objectsale.saleproducts = ventas[indexproductssale].saleproducts;
                    ventas[indexproductssale].saleproducts = parseInt(objectsale.saleproducts) + parseInt(saleproductsnew);
                    console.log("productos existente  | " + ventas[indexproductssale].nameproducts + " - " + ventas[indexproductssale].saleproducts);
                }

            });

            resolve(ventas);
        })
    }

    function runReadProducts(codstore, namestore, name_sheet) {

        var CONTARPRODUCTOS = 0;
        tmpcodstore = codstore;
        descriptionstore = namestore;

        var namecolumnheaderdocument = pruebaequivalencia[namestore];
        /**metodo que formatea el las ventas del excel segun la tienda*/
        readAfterStore(name_sheet, namecolumnheaderdocument).then(function (saleproductsstore) {

            (function (productslistarrays) {

                productslistarrays.forEach(function (products) {

                    CONTARPRODUCTOS++
                    console.log("CONTEO DE PRODUCTOS::::: " + CONTARPRODUCTOS);

                    tmpSaleperiod = products.saleproducts;
                    tmpdescrip = products.nameproducts;

                    if (tmpdescrip == undefined || tmpdescrip == null) {
                        console.log("Objecto NO definido +++++++++++ ");
                    } else {

                        (function (saleperiod, descripproduct, codstore) {
                            /*Buscara productos en la tabla ProductosRetails, ene l caso que encuentre el productos, seguira con el flujo y si no encuentra el producto,
                             * creara el productos que no esta asignado en el sistema*/
                            searchProductRetail(codretail, descripproduct).then(function (productretail) {
                                if (productretail.exists) {
                                    processProductRetailExists(productretail, codstore, saleperiod);
                                } else {
                                    console.log("Productos no existente en la BD : " + productsretail.descrip);

                                }
                            });
                        })(tmpSaleperiod, tmpdescrip.trim(), tmpcodstore);
                    }

                });

            })(saleproductsstore);

        })
    };


    function searchProductRetail(codretail, description) {
        return db.Productos_retails.find({
            where: {
                descripcion: description,
                codRetail: codretail
            }
        }).then(function (result) {

            var object = {};

            if (result == null) {
                object = {
                    exists: false,
                    nameProduct: description
                }
                return object;
            } else {
                object = {
                    exists: true,
                    codEq: result.dataValues.codEq,
                    nameProduct: description
                }
                return object;
            }

        })
    }

    function processProductRetailExists(productretail, codstore, saleperiod) {
        if (productretail.codEq == null) {
            console.log("PRODUCTO CON EQUIVALENCIA NULL " + productretail.nameProduct + " VENTA:" + saleperiod + " TIENDA:" + codstore);
        } else {
            searchProduct(productretail.codEq, codstore).then(function (product) {
                if (product.idprod == null || product.idprod == '') {
                    console.log("PRODUCTO SIN IDE " + productretail.codEq + " " + product.idprod + " " + product.descrip);
                } else {
                    console.log("PRODUCTO CON ID " + productretail.codEq + " " + product.idprod + " " + product.descrip);
                    searchSaleeffective(codretail, codstore, product.idprod, product.idline, product.price, product.pvd, codperiod).then(function (saleeffective) {
                        if (saleeffective.exists) {
                            console.log(" > || " + saleperiod + " " + saleeffective.price + " " + saleeffective.pvd + " " + saleeffective.idProd + " " + codstore + " " + saleeffective.codRetail);
                            saleEffectiveUpdate(saleeffective, saleperiod).then(function (saleeffectiveupdate) {
                                console.log("VENTA EFECTIVA ACTUALIZADO ++++++ " + saleeffectiveupdate)
                            })

                        } else {

                            codmaxsaleeffective++;
                            saleEffectiveCreate(codstore, codmaxsaleeffective, saleperiod, saleeffective).then(function (salecreate) {
                                console.log("VENTA EFECTIVA CREADO ++++++ " + salecreate);
                            });
                        }
                    });
                }
            });
        }
    }


    function saleEffectiveUpdate(saleeffective, saleperiod) {
        console.log("*** saleEffectiveUpdate: where saleEffective:" + saleeffective + " salePeriod:" + saleperiod);

        return db.VentaEfectiva.update({
            precioCosto: saleeffective.price,
            PrecioPVD: saleeffective.pvd,
            cantidad: parseInt(saleperiod),
            audFechaModifica: dateNow
        }, {
            where: {
                codVenta: saleeffective.codSale
            }
        }).then(function (updateventaefectiva) {
            return updateventaefectiva;
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

    function searchProductSplitString(cod_prod, descrip, index) {

        var products_split = descrip.split(' ');
        var countarray = products_split.length;
        var object = {};
        return db.Productos.find({
            where: {
                codigo: cod_prod,
                estado_registro: 'S'
            }
        }).then(function (result) {
            if (result == null) {
                object = {
                    exists_cod_Eq: false,
                    id: null,
                    codigo: null,
                    descrip: descrip,
                    palabra: cod_prod,
                    countstring: index,
                    countstringtotal: countarray
                }
                console.log("searchProduct()Productos if == null, Palabra:" + cod_prod + " Descripcion:" + descrip);
                return object;
            } else {
                object = {
                    exists_cod_Eq: true,
                    id: result.dataValues.id,
                    codigo: result.dataValues.codigo,
                    descrip: descrip,
                    palabra: cod_prod,
                    countstring: index,
                    countstringtotal: countarray
                }
                console.log("searchProduct() Productos if == code, Palabra:" + cod_prod + " Descripcion:" + descrip);
                return object;
            }
        })
    }

    function saleEffectiveCreate(codstore, codmax, saleperiod, saleeffective) {
        console.log("*** saleEffectiveCreate: data codStore:" + codstore + " codMax:" + codmax + " salePeriod: " + saleperiod + " saleEffective: " + saleeffective);
        return db.VentaEfectiva.create({
            codVenta: CodFormat('000000000000000', codmax),
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
            return createventaefectiva;
        })
    }


    function searchProduct(codeq, codstore) {
        console.log("BUSCAR PRODUCTO  TIENDA:" + codstore);
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


    function productsRetailsCreate(codmax, codretail, product) {
        return db.Productos_retails.create({
            id: CodFormat("000000", codmax),
            descripcion: product.description,
            codRetail: codretail,
            codEq: product.id_producto,
            fecha_registro: dateNow,
            fecha_modificacion: null
        }).then(function (result) {
            return result;
        })
    }

    function productsRetailsUpdate(codretail, product) {
        return db.Productos_retails.update({
            descripcion: product.description,
            codRetail: codretail,
            codEq: product.id_producto,
            fecha_modificacion: dateNow
        }, {
            where: {
                id: product.id
            }
        }).then(function (result) {
            return result;
        });
    }

    function existProduct(detalle, codretail) {
        return db.Productos_retails.find({
            where: {
                descripcion: detalle.descrip,
                codRetail: codretail
            }
        }).then(function (result) {
            var object = {};
            if (result == null) {
                object = {
                    exists: false,
                    id_producto: detalle.id,
                    description: detalle.descrip,
                    codretail: codretail
                }
                return object;
            } else {
                object = {
                    exists: true,
                    id: result.dataValues.id,
                    description: detalle.descrip,
                    codretail: codretail,
                    id_producto: detalle.id
                }
                return object;
            }
        })
    }

    function searchCodEqInProductsOxfordByDescriptionProducts(description, codstore) {

        console.log("BUSCANDO EQUIVALENCIAS: " + description + " CODTIENDA: " + codstore);

        return new Promises(function (resolve, reject) {

            var products_split = description.split(' ');
            var object = {
                codigo: null,
                descrip: description,
                exists_cod_Eq: false,
                id: null,
                palabra: null
            };

            for (var i = 0; i < products_split.length; i++) {
                /*Si NO EXISTE , ES NULL, O VACIO*/
                if (!!products_split[i]) {


                    searchProductsOxfordByCod(products_split[i].trim(), description, i + 1, codstore).then(function (product) {
                        if (product.exists_cod_Eq) {
                            object = {
                                codigo: product.codigo,
                                descrip: product.descrip,
                                exists_cod_Eq: product.exists_cod_Eq,
                                id: product.id,
                                palabra: product.palabra
                            }
                        }
                        if (product.countstring == product.countstringtotal) {
                            resolve(object);
                        }
                    });
                }
            }
        });

    }

    function processStore(namestore) {
        return new Promises(function (resolve, reject) {
            var tmpproducts = XLSX.utils.sheet_to_json(workbook.Sheets[namestore]);
            var CONTARPRODUCTOS = 0;
            var saleinfoobject = {};
            tmpproducts.forEach(function (saleinfo) {
                CONTARPRODUCTOS++;
                var objectskeysarrays = Object.keys(saleinfo);
                for (var i = 0; i < objectskeysarrays.length; i++) {
                    var namekeys = objectskeysarrays[i],
                        namekeyssplit = namekeys.split(" "),
                        valuesarrayzero = namekeyssplit[0], typesale = "";
                    if (valuesarrayzero.toUpperCase() == "VTA") {
                        typesale = namekeyssplit[2];
                        if (typesale == "TDA.") {
                            for (var j = 0; j < namekeyssplit.length; j++) {
                                if (j >= 3) {
                                    name += " " + namekeyssplit[j];
                                }
                            }
                            if (!pruebaequivalencia.hasOwnProperty(name.trim())) {
                                storenamearrays.push(name.trim());
                                pruebaequivalencia[name.trim()] = objectskeysarrays[i];
                            } else {
                                console.log("existe registrado la tienda: | " + name.trim());
                            }
                            name = "";
                        }
                    }
                }
                resolve(storenamearrays);
            });
        })
    }

    function CodFormat(format, cod) {
        var countformat = format.length;
        return (format + cod).slice(-countformat);
    }

    function searchProductsOxfordByCod(cod_prod, descrip, index, codstore) {
        console.log("BUSCAR PRODUCTO POR COD PALABRA:" + cod_prod + " DESCRIPCION:" + descrip + " TIENDA:" + codstore);
        var products_split = descrip.split(' ');
        var countarray = products_split.length;
        var object = {};
        return db.Productos.find({
            where: {
                codigo: cod_prod,
                estado_registro: 'S'
            }
        }).then(function (result) {
            if (result == null) {

                object = {
                    exists_cod_Eq: false,
                    id: null,
                    codigo: null,
                    descrip: descrip,
                    palabra: cod_prod,
                    countstring: index,
                    countstringtotal: countarray
                }
                console.log("searchProduct()Productos if == null, Palabra:" + cod_prod + " Descripcion:" + descrip);
                return object;
            } else {
                object = {
                    exists_cod_Eq: true,
                    id: result.dataValues.id,
                    codigo: result.dataValues.codigo,
                    descrip: descrip,
                    palabra: cod_prod,
                    countstring: index,
                    countstringtotal: countarray
                }
                console.log("searchProduct() Productos if == code, Palabra:" + cod_prod + " Descripcion:" + descrip);

                return object;
            }
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
                object = {
                    exists: false,
                    description: namestore
                }
                return object;
            } else {
                object = {
                    exists: true,
                    create: false,
                    codstore: result.dataValues.codTienda,
                    description: result.dataValues.descripcion
                }
                return object;
            }
        })
    }

    function storeCreate(codstore, namestore) {
        return db.Tienda.create({
            codTienda: CodFormat('000000', codstore),
            audFechaCrea: dateNow,
            audFechaModifica: null,
            audIPCrea: 'DEV_IP',
            audIPModifica: null,
            audPCCrea: 'DEV_PC',
            audPCModifica: null,
            audUsuarioCrea: 'DEV_USER',
            audUsuarioModifica: null,
            codRetail: codretail,
            descripcion: namestore,
            direccion: '',
            indBloqueado: 'N',
            indEliminado: 'N'
        }).then(function (createstore) {
            return createstore;
        });
    }

    function countDataFile() {
        return sheets.length;
    }

    function saleEffectiveMax() {
        return db.VentaEfectiva.max('codVenta').then(function (result) {
            var object = {};
            if (result == null) {
                object = {
                    exists: false
                }
                return object;
            } else {
                object = {
                    exists: false,
                    codmax: result
                }
                return object;
            }
        });
    }

    function storeCodMax() {
        return db.Tienda.max('codTienda').then(function (result) {
            var object = {};
            if (result == null) {
                object = {
                    exists: false
                }
                return object;
            } else {
                object = {
                    exists: true,
                    codmax: result
                }
                return object
            }
        })
    }

    function productsRetailMax() {
        return db.Productos_retails.max('id').then(function (result) {
            var object = {};
            if (result == null) {
                object = {
                    exists: false
                }
                return object;
            } else {
                object = {
                    exists: false,
                    codmax: result
                }
                return object;
            }
        })
    }

    function searchPeriod(day, month, year) {
        return db.SisPeriodos.find({
            where: {
                fechafin: year + "-" + month + "-" + day
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
                    codperiod: result.dataValues.codPeriodo
                }
                return object;
            }
        })
    }

    function searchRetialByName(namestore) {
        return db.Retails.find({where: {nombre: namestore}}).then(function (result) {
            var object = {};
            if (result == null) {
                object = {
                    exists: false,
                    nameretail: namestore
                }
                return object;
            } else {
                object = {
                    exists: true,
                    nameretail: result.dataValues.nombre,
                    codretail: result.dataValues.codRetail
                }
                return object;
            }
        })
    }


}


