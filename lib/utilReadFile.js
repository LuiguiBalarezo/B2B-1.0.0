'use strict';
var XLSX = require('xlsx'),
    FS = require("fs"),
    Promises = require('bluebird'),
    db = require('./database'),
    moment = require('moment'),
    now = moment(),
    dateNow = now.toDate(),
    sheetsread = [],
    datasplit = "",
    allproducts = [],
    workbook = "",
    columnsale = "",
    columnproducts = "";

module.exports = {

    setColumnsReadInFile: function setcolumnsreadinfile(columnnamesale, columnnameproduct) {
        columnsale = columnnamesale;
        columnproducts = columnnameproduct;
    },

    //readFileWithTab: function readfilewithtab(absolutePathToFile) {
    //    return new Promises(function (resolve, reject) {
    //         FS.readFile(absolutePathToFile, "utf8", function (err, data) {
    //            workbook = data;
    //            datasplit = workbook.split('\t');
    //            resolve(datasplit);
    //        });
    //    })
    //},

    /** Lee el nombre de cada hoja*/
    readFileXLS: function readfile(absolutePathToFile) {
        return new Promises(function (resolve, reject) {
            sheetsread = [];
            workbook = XLSX.readFile(absolutePathToFile);
            var namesheet = "";
            workbook.SheetNames.forEach(function (sheetName) {
                namesheet = sheetName.trim();
                if (namesheet != "") {
                    if (namesheet.search("Hoja") == -1) {
                        if (namesheet.search("Sheet") == -1) {
                            sheetsread.push(sheetName.trim());
                        } else {
                            console.log("No se encuentra hoja (sheet) con formato valido en el reporte procesado!!!.")
                        }
                    }
                }
            });
            resolve(sheetsread);
        });
    },

    counSheets: function countsheets() {
        return sheetsread.length;
    },

    getCodMaxSaleEffective: function saleEffectiveMax() {
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
    },

    getCodMaxStore: function storeCodMax() {
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
    },
    getCodMaxProductsRetail: function productsRetailMax() {
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
    },

    getPeriodSale: function searchPeriod(day, month, year) {
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
    },

    getInfoRetailByName: function searchRetail(name) {
        return db.Retails.find({where: {nombre: name}}).then(function (result) {
            var object = {};
            if (result == null) {
                object = {
                    exists: false,
                    nameretail: name
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
    },

    /** Realiza el proceso de obtener informacion basica de la tienda (cod, existe, descripcion) y en el caso que no exista crearlo*/
    processStoresCreate: function processstore(codmax, sheets, codretail) {
        var namestore = "";
        var infostore = {};
        var storesarray = [];
        return Promises.resolve(sheets._settledValue).each(function (namestore) {
            return searchstore(codretail, namestore).then(function (store) {
                infostore = {};
                namestore = store.description;
                if (store.exists) {
                    infostore.codstore = store.codstore;
                    infostore.namestore = namestore;
                    return storesarray.push(infostore);
                } else {
                    codmax++;
                    return createStore(codmax, codretail, namestore, dateNow).then(function (result) {
                        infostore.codstore = result.dataValues.codTienda;
                        infostore.namestore = result.dataValues.descripcion;
                        return storesarray.push(infostore);
                        debugger;
                    })
                }
            });
        }).then(function () {
            return storesarray;
        })
    },


    /** Realiza el proceso de obtener informacion basica de la tienda (cod, existe, descripcion) y en el caso que no exista crearlo*/
    processStoresCreate_2: function processstore(codmax, sheets, codretail) {
        var namestore = "";
        var infostore = {};
        var storesarray = [];
        return Promises.resolve(sheets).each(function (namestore) {
            return searchstore(codretail, namestore).then(function (store) {
                infostore = {};
                namestore = store.description;
                if (store.exists) {
                    infostore.codstore = store.codstore;
                    infostore.namestore = namestore;
                    return storesarray.push(infostore);
                } else {
                    codmax++;
                    return createStore(codmax, codretail, namestore, dateNow).then(function (result) {
                        infostore.codstore = result.dataValues.codTienda;
                        infostore.namestore = result.dataValues.descripcion;
                        return storesarray.push(infostore);
                    })
                }
            });
        }).then(function () {
            return storesarray;
        })
    },

    getInfoStoreByCodRetailAndName: function searchstore(codretail, namestore) {
        return searchstore(codretail, namestore);
    },

    /** Recolecta todos los productos de todos las tiendas, luego filtra quitando los repetidos y solo entregando
     * productos unicos*/
    getProductsAllRecollect_1: function getrecollect(sheets) {
        var products = [];
        var nameproduct = "";
        return Promises.resolve(sheets).each(function (store) {
            products = getproducts(store.namestore);
            products.forEach(function (name) {
                nameproduct = name[columnproducts].trim();
                if (allproducts.indexOf(nameproduct) == -1) {
                    allproducts.push(nameproduct);
                } else {
                    console.log("Productos repetidos " + nameproduct);
                }
            })
        }).then(function () {
            return allproducts;
        });
    },

    /** Realiza el filtrado para detectar que productos son aptos para su adecuado proceso*/
    processSearchAllProducts: function processsearchallproducts(codretail, allproducts) {
        var resultproducts = [];
        return Promises.resolve(allproducts).map(function (nameproducts) {
            return processSearchCodEqByDescription(nameproducts).then(function (result) {
                if (result.exists_cod_Eq) {
                    return searchProductsRetail(codretail, result.id, nameproducts).then(function (products) {
                        return products;
                    });
                } else {
                    console.log("El producto " + result.descrip + " No cuenta con un codigo dentro de su descripion o si cuenta con un codigo pero no esta registrado en los productos oxford, y por lo cual no podra ser procesado" +
                    "para obtener la equivalencia de los productos de oxford");
                }
            });
        }).then(function (productsinfo) {
            /** Si algunos de los resultados aparecen como  "undefined" significa que el producto no entre su descripcion no existe un codigo valido
             * para realizar una comparacion con la tabla productos oxford, la solucion es que oxford pueda entregar todos los productos que maneja actualmente
             * deacuerdo al mes del reporte que se esta procesando*/

            /** Los resultados que contienen datos true, significan que si existe un producto con una descripcion que contiene un codigo con el cual se podria
             * realizar una equivalencia, y los que muestran false,
             * significa que los productos no se encuentran registrados en la tabla productos retails, osea son nuevos y pueden ser agregados*/
            productsinfo.forEach(function (result) {
                if (result != undefined) {
                    resultproducts.push(result);
                }
            })
            return resultproducts;
        })
    },

    /** Realiza el proceso de busqueda de un producto mediante, para poder crear o actualizar si fuera necesario*/
    processProductsCreateOrUpdate: function processproductscreateorupdate(codmax, codretail, products) {
        var nameproduct = "";
        return Promises.resolve(products).each(function (productsinfo) {
            nameproduct = productsinfo.nameProduct;
            if (productsinfo.exists) {
                /** Cuando el producto esta registrado en la bd se podra realizar una modificacion de su nombre, ya que en algun momento
                 * podra ser cambiado pero siempre manteniendo el "codigo", ya que el codigo puede ser movido de posicion pero sigue siendo el mismo codigo de el producto*/
                return updateProductRetail(codretail, productsinfo.nameProduct, productsinfo.id, productsinfo.codEq, dateNow).then(function (result) {
                    return result;
                });
            } else {
                return processSearchCodEqByDescription(nameproduct).then(function (result) {
                    if (result.exists_cod_Eq) {
                        codmax++;
                        return createProductRetail(codmax, codretail, result.descrip, result.id, dateNow).then(function (result) {
                            return result;
                        });
                    } else {
                        console.log("El producto " + result.descrip + " No cuenta con un codigo dentro de su descripion o si cuenta con un codigo pero no esta registrado en los productos oxford, y por lo cual no podra ser procesado" +
                        "para obtener la equivalencia de los productos de oxford");
                    }
                });
            }
        }).then(function () {
            return true;
        })
    },

    /** Porcesara todas las ventas de todos las tiendas*/
    processSale: function processale(codmax, codretail, stores, codperiod, namecolumsale) {
        var codstore = "";
        var namestore = "";
        var salebystore = "";
        var sale = "";
        var nameproduct = "";
        var namecolum = namecolumsale;

        return Promises.resolve(stores).each(function (storeinfo) {
            codstore = storeinfo.codstore;
            namestore = storeinfo.namestore;

            salebystore = XLSX.utils.sheet_to_json(workbook.Sheets[namestore]);

            return processSumRepeatSale(salebystore, codstore, namecolum).then(function (sales) {
                return sales;
            }).then(function (sales) {

                var codeq = "";
                var idprod = "";
                var idline = "";
                var price = "";
                var pvd = "";
                var codstore_1 = "";

                sales.forEach(function (saleinfo) {

                    nameproduct = saleinfo.nameproduct;
                    sale = saleinfo.saleproduct;
                    codstore_1 = saleinfo.codstore;

                    return searchProductsRetailByDescripcion(codretail, nameproduct, sale, codstore).then(function (resultproductretail) {
                        return resultproductretail;
                    }).then(function (resultproduct) {
                        codeq = resultproduct.codEq;


                        if (resultproduct.exists) {
                            return searchProductsOxfordById(codeq, resultproduct.sale, resultproduct.codStore).then(function (resultproductoxford) {
                                idprod = resultproductoxford.idprod;
                                idline = resultproductoxford.idline;
                                price = resultproductoxford.price;
                                pvd = resultproductoxford.pvd;

                                return searchSaleEffective(codretail, idprod, idline, price, pvd, codperiod, resultproductoxford.sale, resultproductoxford.codStore).then(function (resultsale) {
                                    if (resultsale.exists) {
                                        updateSaleEffective(resultsale, dateNow);
                                    } else {
                                        codmax++;
                                        createSaleEffective(codmax, codstore, resultsale, dateNow);
                                    }
                                });
                            });
                        } else {
                            console.log("No existe producto -----| " + resultproduct.nameProduct);
                            /** Generar txt mostrando los productos que no fueron procesados*/
                        }

                    });

                })
            })
        }).then(function () {
            return null;
        })
    },


    processSale_2 :function processSale_2(codmax, codretail, stores, codperiod, data) {
        var codstore = "";
        var namestore = "";
        var salebystore = "";
        var sale = "";
        var nameproduct = "";

        return Promises.resolve(stores).each(function (storeinfo) {
            codstore = storeinfo.codstore;
            namestore = storeinfo.namestore;

            salebystore = data[namestore];

            return processSumRepeatSale_2(salebystore, codstore).then(function (sales) {
                return sales;
            }).then(function (sales) {

                var codeq = "";
                var idprod = "";
                var idline = "";
                var price = "";
                var pvd = "";
                var codstore_1 = "";

                sales.forEach(function (saleinfo) {

                    nameproduct = saleinfo.nameproduct;
                    sale = saleinfo.saleproduct;
                    codstore_1 = saleinfo.codstore;

                    return searchProductsRetailByDescripcion_2(codretail, nameproduct, sale, codstore).then(function (resultproductretail) {
                        return resultproductretail;
                    }).then(function (resultproduct) {
                        codeq = resultproduct.codEq;


                        if (resultproduct.exists) {
                            return searchProductsOxfordById(codeq, resultproduct.sale, resultproduct.codStore).then(function (resultproductoxford) {
                                idprod = resultproductoxford.idprod;
                                idline = resultproductoxford.idline;
                                price = resultproductoxford.price;
                                pvd = resultproductoxford.pvd;

                                return searchSaleEffective(codretail, idprod, idline, price, pvd, codperiod, resultproductoxford.sale, resultproductoxford.codStore).then(function (resultsale) {
                                    if (resultsale.exists) {
                                        updateSaleEffective(resultsale, dateNow);
                                    } else {
                                        codmax++;
                                        createSaleEffective(codmax, codstore, resultsale, dateNow);
                                    }
                                });
                            });
                        } else {
                            console.log("No existe producto -----| " + resultproduct.nameProduct);
                            /** Generar txt mostrando los productos que no fueron procesados*/
                        }

                    });

                })
            })
        }).then(function () {
            return null;
        })
    }




};

var createSaleEffective = function createsaleeffective(codmax, codstore, saleeffective, date) {
    return db.VentaEfectiva.create({
        codVenta: codFormat('000000000000000', codmax),
        audFechaCrea: date,
        audFechaModifica: null,
        audIPCrea: "DEV_IP",
        audIPModifica: null,
        audPCCrea: "DEV_PC",
        audPCModifica: null,
        audUsuarioCrea: "DEV_USER",
        audUsuarioModifica: null,
        cantidad: parseInt(saleeffective.sale),
        indBloqueado: "N",
        indEliminado: "N",
        codJefe: null,
        codLinea: saleeffective.idLine,
        margen: parseFloat("0.00"),
        codPeriodo: saleeffective.codPeriod,
        precioCosto: saleeffective.price,
        precioPVD: saleeffective.pvd,
        codProducto: saleeffective.idProd,
        codRetail: saleeffective.codRetail,
        codSupervisor: null,
        codTienda: saleeffective.codStore,
        totalCosto: parseFloat("0.00"),
        totalPVD: parseFloat("0.00"),
        codVendedor: null
    }).then(function (createventaefectiva) {
        return createventaefectiva;
    })
}

var updateSaleEffective = function updatesaleefective(saleeffective, date) {
    return db.VentaEfectiva.update({
        precioCosto: saleeffective.price,
        PrecioPVD: saleeffective.pvd,
        cantidad: saleeffective.sale,
        audFechaModifica: date
    }, {
        where: {
            codVenta: saleeffective.codSale
        }
    }).then(function (updateventaefectiva) {
        return updateventaefectiva;
    })
}

var searchSaleEffective = function searchsaleeffective(codretail, idprod, idline, price, pvd, codperiod, saleproduct, codstore) {

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
                codPeriod: codperiod,
                sale: saleproduct
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
                codPeriod: codperiod,
                sale: saleproduct
            }

            return object;
        }
    })
}

/** Reaaliza la busqueda de un producto en la tabla oxford
 * Nota: Sale es para mantener la venta deacuerdo a la consulta del producto*/
var searchProductsOxfordById = function searchproductsoxford(codeq, saleproduct, codstore) {
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
                pvd: product.dataValues.pvd,
                sale: saleproduct,
                codStore: codstore
            }
            return object;
        }
    })
}

/** Obtiene todas las ventas repetidas y las suma entre su igual*/
var processSumRepeatSale = function processsumrepeatsale(salesstore, codstore) {
    var indexsale = "";
    var salenew = "";
    var saleold = "";
    var salesum = "";
    var nameproduct = "";
    var productsarray = [];
    var saleobject = {};
    var sales = [];

    return new Promises.resolve(salesstore).each(function (sale) {
        saleobject = {};
        nameproduct = sale[columnproducts];
        salenew = sale[columnsale];

        if (productsarray.indexOf(nameproduct.trim()) == -1) {
            productsarray.push(nameproduct.trim());
            saleobject.nameproduct = nameproduct.trim();
            saleobject.saleproduct = salenew;
            saleobject.codstore = codstore;
            sales.push(saleobject);
        } else {
            indexsale = productsarray.indexOf(nameproduct.trim());
            nameproduct = sales[indexsale].nameproduct;
            saleold = sales[indexsale].saleproduct;
            salesum = parseInt(saleold) + parseInt(salenew);
            sales[indexsale].saleproduct = salesum;
        }

    }).then(function () {
        return sales;
    })

}

/** Obtiene todas las ventas repetidas y las suma entre su igual*/
var processSumRepeatSale_2 = function processsumrepeatsale(salesstore, codstore) {
    var indexsale = "";
    var salenew = "";
    var saleold = "";
    var salesum = "";
    var nameproduct = "";
    var productsarray = [];
    var saleobject = {};
    var sales = [];

    return new Promises.resolve(salesstore).each(function (sale) {
        saleobject = {};
        nameproduct = sale["producto"];
        salenew = sale["venta"];

        if (productsarray.indexOf(nameproduct.trim()) == -1) {
            productsarray.push(nameproduct.trim());
            saleobject.nameproduct = nameproduct.trim();
            saleobject.saleproduct = salenew;
            saleobject.codstore = codstore;
            sales.push(saleobject);
        } else {
            indexsale = productsarray.indexOf(nameproduct.trim());
            nameproduct = sales[indexsale].nameproduct;
            saleold = sales[indexsale].saleproduct;
            salesum = parseInt(saleold) + parseInt(salenew);
            sales[indexsale].saleproduct = salesum;
        }

    }).then(function () {
        return sales;
    })

}



var createStore = function createstore(codmax, codretail, namestore, date) {
    return db.Tienda.create({
        codTienda: codFormat('000000', codmax),
        audFechaCrea: date,
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

/** Obtiene todos los productos registros deacuerdo a la hoja (sheet)*/
var getproducts = function processallproductsbystores(namestore) {
    return XLSX.utils.sheet_to_json(workbook.Sheets[namestore]);
}

/** Realiza una busqueda para el codig de la equivalencia del producto, mediante la fragmentacion de
 * la descripcion del producto*/
var processSearchCodEqByDescription = function processsearchcodeqbydescription(descriptionproduct) {
    var products_split = descriptionproduct.split(' ');

    var object = {
        codigo: null,
        descrip: descriptionproduct,
        exists_cod_Eq: false,
        id: null,
        palabra: null
    };

    /**Realiza una fragmentacion de la descripcion del producto, para hacer una comparacion palabra por palabra y asi encontrar
     * el codigo que sea igual algun producto que contenga dicho codigo.*/
    return Promises.resolve(products_split).map(function (string) {
        /** Realiza la busqueda por codigo (palabra string)*/
        return searchProductOxfordByCodigo(string, descriptionproduct).then(function (info) {
            return info;
        });
    }).then(function (infoproductarray) {
        infoproductarray.forEach(function (info) {
            if (info.exists_cod_Eq) {
                object = {
                    codigo: info.codigo,
                    descrip: info.descrip,
                    exists_cod_Eq: info.exists_cod_Eq,
                    id: info.id,
                    palabra: info.palabra
                }
            }
        })
        return object;
    });

}

var searchProductOxfordByCodigo = function searchproductoxfordbycodigo(string, descripdescripcionproduct) {

    var object = {};

    return db.Productos.find({
        where: {
            codigo: string,
            estado_registro: 'S'
        }
    }).then(function (result) {
        if (result == null) {
            object = {
                exists_cod_Eq: false,
                id: null,
                codigo: null,
                descrip: descripdescripcionproduct,
                palabra: string
            }
            console.log("searchProduct()Productos if == null, Palabra:" + string + " Descripcion:" + descripdescripcionproduct);
            return object;
        } else {
            object = {
                exists_cod_Eq: true,
                id: result.dataValues.id,
                codigo: result.dataValues.codigo,
                descrip: descripdescripcionproduct,
                palabra: string
            }
            console.log("searchProduct() Productos if == code, Palabra:" + string + " Descripcion:" + descripdescripcionproduct);
            return object;
        }
    })
}


var createProductRetail = function productsRetailsCreate(codmax, codretail, nameproduct, codeq, date) {
    return db.Productos_retails.create({
        id: codFormat("000000", codmax),
        descripcion: nameproduct,
        codRetail: codretail,
        codEq: codeq,
        fecha_registro: date,
        fecha_modificacion: null
    }).then(function (result) {
        return result;
    })
}

var updateProductRetail = function productsRetailsUpdate(codretail, nameproduct, idproduct, codeq, date) {
    return db.Productos_retails.update({
        descripcion: nameproduct,
        codRetail: codretail,
        codEq: codeq,
        fecha_modificacion: date
    }, {
        where: {
            id: idproduct
        }
    }).then(function (result) {
        return result;
    });
}

var codFormat = function CodFormat(format, cod) {
    var countformat = format.length;
    return (format + cod).slice(-countformat);
}

/**Realiza la busqueda de un producto del retail mediante codigo de equivalencia*/
var searchProductsRetail = function searchproducts(codretail, coeq, descripcionproducts) {
    return db.Productos_retails.find({
        where: {
            codEq: coeq,
            codRetail: codretail
        }
    }).then(function (result) {

        var object = {};

        if (result == null) {
            object = {
                exists: false,
                nameProduct: descripcionproducts
            }
            return object;
        } else {
            object = {
                exists: true,
                id: result.dataValues.id,
                codEq: result.dataValues.codEq,
                nameProduct: descripcionproducts
            }
            return object;
        }

    })
}

/** Realiza la buequeda deun product del retail mediante nombre producto
 * Nota: la variable (sale) es para mantener el valor de venta de dicho producto y entregarlo al acabar mientras realiza la busqueda*/
var searchProductsRetailByDescripcion = function searchproductsretailsByDescripcion(codretail, nameproduct, saleproduct, codstore) {
    return db.Productos_retails.find({
        where: {
            descripcion: nameproduct,
            codRetail: codretail
        }
    }).then(function (result) {

        var object = {};

        if (result == null) {
            object = {
                exists: false,
                nameProduct: nameproduct,
                sale: saleproduct,
                codStore: codstore
            }
            return object;
        } else {
            object = {
                exists: true,
                id: result.dataValues.id,
                codEq: result.dataValues.codEq,
                nameProduct: nameproduct,
                sale: saleproduct,
                codStore: codstore
            }
            return object;
        }
    })
}

var searchProductsRetailByDescripcion_2 = function searchproductsretailsByDescripcion(codretail, nameproduct, saleproduct, codstore) {
    return db.Productos_retails.find({
        where: {
            descripcion: nameproduct,
            codRetail: codretail
        }
    }).then(function (result) {

        var object = {};

        if (result == null) {
            object = {
                exists: false,
                nameProduct: nameproduct,
                sale: saleproduct,
                codStore: codstore
            }
            return object;
        } else {
            object = {
                exists: true,
                id: result.dataValues.id,
                codEq: result.dataValues.codEq,
                nameProduct: nameproduct,
                sale: saleproduct,
                codStore: codstore
            }
            return object;
        }
    })
}

/** ESTE METODO FUE SEPARADO  EN UNA VARIABLE PARA PODER USARSE DENTRO DE LA MISMA CLASE, YA QUE NO SE PUEDE USAR UN THIS EN ESTE CONTEXTO*/
var searchstore = function searchstore(codretail, namestore) {
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
                codstore: result.dataValues.codTienda,
                description: result.dataValues.descripcion
            }
            return object;
        }
    })
}