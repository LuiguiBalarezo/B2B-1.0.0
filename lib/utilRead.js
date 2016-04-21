'use strict';
var XLSX = require('xlsx'),
    FS = require("fs"),
    Promises = require('bluebird'),
    db = require('./database'),
    moment = require('moment'),
    now = moment(),
    dateNow = now.toDate(),
    workbook = "",
    equivalencias = {},
    codmaxsaleffective = "",
    storenamearrays = [];

module.exports = {
    readFileXLS: function (pathfile, validatesheet) {
        return readFileXLS(pathfile, validatesheet);
    },
    getCodMaxSale: function () {
        return getCodMaxSale();
    },
    getPeriod: function (month, year) {
        return getPeriod(month, year);
    },
    getInfoRetail: function (nameretail) {
        return getInfoRetail(nameretail);
    },
    getInfoStores: function (codretail, storesarray) {
        return getInfoStores(codretail, storesarray);
    },
    searchStore: function (codretail, store) {
        return searchStore(codretail, store);
    },
    getAllSales_standard: function (codretail, codperiod, stores, columndescription, columnsale) {
        return getAllSales_standard(codretail, codperiod, stores, columndescription, columnsale);
    },
    getEnabledProducts: function (sales) {
        return getEnabledProducts(sales);
    },
    processSearchProduct: function (sales) {
        return processSearchProduct(sales);
    },
    searchProductByCod: function (cod, sales) {
        return searchProductByCod(cod, sales);
    },
    getFilterProductRepeat: function (sales) {
        return getFilterProductRepeat(sales);
    },
    proccessSales: function (sales) {
        return proccessSales(sales);
    },
    getRecollectStores_estilos: function (sheets) {
        return getRecollectStores_estilos(sheets);
    },
    proccessRows_estilos: function (rows) {
        return proccessRows_estilos(rows);
    },
    getInfoStores_estilos: function (codretail, storesarray) {
        return getInfoStores_estilos(codretail, storesarray);
    },
    searchStore_estilos: function (codretail, namecolumn, store) {
        return searchStore_estilos(codretail, namecolumn, store);
    },
    getAllSales_estilos: function (codretail, codperiod, stores, sheets, columndescription) {
        return getAllSales_estilos(codretail, codperiod, stores, sheets, columndescription);
    },
    getRecollectStores_ripley: function (sheets) {
        return getRecollectStores_ripley(sheets);
    },
    proccessRowsStores_ripley: function (rows, columnstores, indexincrement) {
        return proccessRowsStores_ripley(rows, columnstores, indexincrement);
    },
    getInfoStores_ripley: function (codretail, storesarray) {
        return getInfoStores_ripley(codretail, storesarray);
    },
    searchStore_ripley: function (codretail, store) {
        return searchStore_ripley(codretail, store);
    },
    getAllSales_ripley: function (codretail, codperiod, stores, sheets, columndescription, columnsale) {
        return getAllSales_ripley(codretail, codperiod, stores, sheets, columndescription, columnsale);
    },
    searchSaleEffective: function (sale) {
        return searchSaleEffective(sale);
    },
    createSaleEffective: function (codmax, sale, date) {
        return createSaleEffective(codmax, sale, date);
    },
    codFormat: function (format, cod) {
        return codFormat(format, cod);
    }
}

var readFileXLS = function (pathfile, validatesheet) {
    var returnsheets = "";
    return new Promises(function (resolve, reject) {
        console.log("readFileXLS..!! ");
        /** Obtener todos los datos de el excel*/
        workbook = getReadFile(pathfile);
        /*Procesa todos los sheets (valida si la hoja no es vacia y si tiene nombres validos)*/
        getSheet(workbook.SheetNames, validatesheet).then(function (resultsheets) {
            resolve(resultsheets);
        });
    });
}
var getReadFile = function (path) {
    return XLSX.readFile(path);
}
var getSheetToJson = function (sheet) {
    var rows = "";
    return new Promises(function (resolve, reject) {
        rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
        resolve(rows);
    })
}
var getSheet = function (sheetarrrays, validatesheet) {
    var returnsheetsarrays = [];
    return Promises.resolve(sheetarrrays).each(function (sheet) {
        if (sheet != "") {
            if (validatesheet) {
                if (sheet.search("Hoja") == -1) {
                    if (sheet.search("Sheet") == -1) {
                        /** Obtiene todos los registros que contiene la hoja*/
                        getSheetToJson(sheet).then(function (rows) {
                            if (rows.length > 0) {
                                returnsheetsarrays.push(sheet);
                            }
                        });
                    } else {
                        console.log("No existe Hojas en el file procesado!!.");
                    }
                }
            } else {
                /** Obtiene todos los registros que contiene la hoja*/
                getSheetToJson(sheet).then(function (rows) {
                    if (rows.length > 0) {
                        returnsheetsarrays.push(sheet);
                    }
                });
            }
        } else {
            console.log("Hoja Vacio!!.");
        }
    }).then(function () {
        return returnsheetsarrays;
    })
}
var getCodMaxSale = function () {
    return db.VentaEfectiva.max('codVenta').then(function (result) {
        var object = {};
        if (result != null) {
            codmaxsaleffective = result;
        }
    });
}
var getPeriod = function (month, year) {
    return db.SisPeriodos.find({
        where: {
            mes: month,
            anio: year
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
                month: result.dataValues.anio,
                year: result.dataValues.mes,
                codperiod: result.dataValues.codPeriodo,
                startdate: result.dataValues.fechaInicio,
                enddate: result.dataValues.fechaFin
            }
            return object;
        }
    })
}
var getInfoRetail = function (nameretail) {
    return db.Retails.find({where: {nombre: nameretail}}).then(function (result) {
        var object = {};
        if (result == null) {
            object = {
                exists: false,
                nameretail: nameretail
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
var getInfoStores = function (codretail, storesarray) {
    var namestore = "", object = {}, storearrays = [];
    return Promises.resolve(storesarray).each(function (namestore) {
        return searchStore(codretail, namestore).then(function (infostore) {
            object = {};
            namestore = infostore.namestore;
            if (infostore.exists) {
                object.codstore = infostore.codstore;
                object.namestore = infostore.namestore;
                return storearrays.push(object);
            } else {
                console.log("No existe tienda : " + namestore + " en la BD!!.");
            }
        })
    }).then(function () {
        return storearrays;
    })
}
var searchStore = function (codretail, store) {
    return db.Tienda.find({
        where: {
            codRetail: codretail,
            descripcion: store
        }
    }).then(function (result) {
        var object = {};
        if (result == null) {
            object = {
                exists: false,
                namestore: store
            }
            return object;
        } else {
            object = {
                exists: true,
                codstore: result.codTienda,
                namestore: result.descripcion
            }
            return object;
        }
    })
}
var getAllSales_standard = function (codretail, codperiod, stores, columndescription, columnsale) {
    var sales = "", codstore = "", namestore = "", namesheet = "", salearrays = [], description = "", sale = "", object = {};
    return new Promises.resolve(stores).each(function (store) {
        sales = XLSX.utils.sheet_to_json(workbook.Sheets[store.namestore]);
        for (var i = 0; i < sales.length; i++) {
            object = {};
            object.codretail = codretail;
            object.product = sales[i][columndescription];
            object.sale = sales[i][columnsale];
            object.codstore = store.codstore;
            object.namestore = store.namestore;
            object.period = codperiod;
            salearrays.push(object)
        }
    }).then(function () {
        return salearrays;
    });
}
var getEnabledProducts = function (sales) {
    var saleenabledarray = [];
    return new Promises.resolve(sales).each(function (sale) {
        return processSearchProduct(sale).then(function (result) {
            saleenabledarray.push(result);
        })
    }).then(function () {
        return saleenabledarray;
    })
}
var processSearchProduct = function (sale) {
    var description = sale.product;
    var description_split = description.split(' ');
    var object = {
        codigo: null,
        codretail: sale.codretail,
        description: sale.product,
        exists_cod_Eq: false,
        period: sale.period,
        id: null,
        string: null,
        codlinea: null,
        preciocosto: null,
        pvd: null,
        sale: sale.sale,
        codstore: sale.codstore,
        namestore: sale.namestore
    };

    return Promises.resolve(description_split).map(function (string) {
        return searchProductByCod(string, sale).then(function (result) {
            return result;
        })
    }).then(function (infoarray) {
        infoarray.forEach(function (info) {
            if (info.exists_cod_Eq) {
                object = {
                    codigo: info.codigo,
                    codretail: info.codretail,
                    description: info.description,
                    exists_cod_Eq: info.exists_cod_Eq,
                    period: info.period,
                    id: info.id,
                    string: info.string,
                    codlinea: info.codlinea,
                    preciocosto: info.preciocosto,
                    pvd: info.pvd,
                    sale: info.sale,
                    codstore: info.codstore,
                    namestore: info.namestore
                }
            }
        });
        return object;
    })
}
var searchProductByCod = function (codstring, sale) {
    var object = {};
    return db.ComProductos.find({
        where: {
            codInterno: codstring,
            indBloqueado: 'N',
            indEliminado: 'N'
        }
    }).then(function (result) {
        if (result == null) {
            object = {
                codigo: null,
                codretail: sale.codretail,
                description: sale.product,
                exists_cod_Eq: false,
                period: sale.period,
                id: null,
                string: null,
                codlinea: null,
                preciocosto: null,
                pvd: null,
                sale: sale.sale,
                codstore: sale.codstore,
                namestore: sale.namestore
            }
            return object;
        } else {
            object = {
                codigo: result.dataValues.codInterno,
                codretail: sale.codretail,
                description: sale.product,
                exists_cod_Eq: true,
                period: sale.period,
                id: result.dataValues.codProducto,
                string: codstring,
                codlinea: result.dataValues.codLinea,
                preciocosto: result.dataValues.precioCosto,
                pvd: result.dataValues.pvd,
                sale: sale.sale,
                codstore: sale.codstore,
                namestore: sale.namestore
            }
            return object;
        }
    })
}
var getFilterProductRepeat = function (sales) {
    var salesarrays = [], codstore = "", nameproduct = "", codprod = "", productsarray = [], codstorearray = [], saleold = "", salenew = "", object = {}, index = "", sumsale = "", codproductrepeat = [];
    return new Promises.resolve(sales).each(function (sale) {

        codprod = sale.id;
        nameproduct = sale.description;
        codstore = sale.codstore;
        object = {};

        /*Filtrearemos los productos que no cuentan con un codigo valido extraido de la bd , en la tabla productos*/
        if (codprod != null) {
            if (codstorearray.indexOf(codstore) == -1) {
                codstorearray.push(codstore);
                productsarray = [];
                productsarray.push(codprod);
                object = {
                    codigo: sale.codigo,
                    codretail: sale.codretail,
                    description: nameproduct,
                    exists_cod_Eq: sale.exists_cod_Eq,
                    period: sale.period,
                    id: sale.id,
                    string: sale.string,
                    codlinea: sale.codlinea,
                    preciocosto: sale.preciocosto,
                    pvd: sale.pvd,
                    sale: sale.sale,
                    codstore: sale.codstore,
                    namestore: sale.namestore
                }
                salesarrays.push(object);
            } else {
                if (productsarray.indexOf(codprod) == -1) {
                    productsarray.push(codprod);
                    object = {
                        codigo: sale.codigo,
                        codretail: sale.codretail,
                        description: nameproduct,
                        exists_cod_Eq: sale.exists_cod_Eq,
                        period: sale.period,
                        id: sale.id,
                        string: sale.string,
                        codlinea: sale.codlinea,
                        preciocosto: sale.preciocosto,
                        pvd: sale.pvd,
                        sale: sale.sale,
                        codstore: sale.codstore,
                        namestore: sale.namestore
                    }
                    salesarrays.push(object);
                } else {
                    index = productsarray.indexOf(codprod);
                    salenew = sale.sale;
                    saleold = salesarrays[index].sale;
                    sumsale = parseInt(saleold) + parseInt(salenew);
                    salesarrays[index].sale = sumsale;
                }
            }
        }


    }).then(function () {
        return salesarrays;
    })
}
var proccessSales = function (sales) {
    var saleold = "";
    return new Promises.resolve(sales).each(function (sale) {
        if (sale.id != null) {
            searchSaleEffective(sale).then(function (result) {
                if (result.exists) {
                    //console.log("DATA: " + JSON.stringify(result));
                    saleold = result.sale;

                    updateSaleEffective(result, dateNow).then(function (update) {
                        console.log("UPDATE " + update);
                    });
                } else {
                    codmaxsaleffective++;
                    createSaleEffective(codmaxsaleffective, result, dateNow).then(function (create) {
                        console.log("VENTA CREADA : " + create);
                    });
                }
            })
        }
    }).then(function () {

    });
}
var getRecollectStores_estilos = function (sheets) {
    var rows = "", arraysstore = [];
    return new Promises.resolve(sheets).each(function (sheet) {
        rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
        return proccessRows_estilos(rows).then(function (results) {
            arraysstore = results;
        })
    }).then(function () {
        return arraysstore;
    });
}
var proccessRows_estilos = function (rows) {
    var count = "", namestore = "", objectkeysarrays = "", column = "", columnsplit = "", columntype = "", initialcolumn = "", namestoresobject = {}, storesarrays = [], storesrepeat = [];
    return new Promises.resolve(rows).each(function (row) {
        count++;
        /** la primera fila tiene toda la informacion necesaria */
        if (count == 1) {
            objectkeysarrays = Object.keys(row);
            namestoresobject = {};
            for (var i = 0; i < objectkeysarrays.length; i++) {
                column = objectkeysarrays[i];
                columnsplit = column.split(" ");
                initialcolumn = columnsplit[0];

                if (initialcolumn.toUpperCase() == "VTA") {
                    columntype = columnsplit[2];
                    if (columntype.toUpperCase() == "TDA.") {
                        for (var j = 0; j < columnsplit.length; j++) {
                            if (j >= 3) {
                                namestore += " " + columnsplit[j];
                            }
                        }
                        namestoresobject = {
                            namecolumn: column,
                            namestore: namestore.trim()
                        }

                        if (storesrepeat.indexOf(column) == -1) {
                            storesrepeat.push(column);
                            storesarrays.push(namestoresobject);
                        }
                        namestore = "";
                    }
                }
            }
        }
    }).then(function () {
        return storesarrays;
    })

}
var getInfoStores_estilos = function (codretail, storesarray) {
    var namestore = "", object = {}, storearrays = [];
    return new Promises.resolve(storesarray).each(function (namestore) {
        return searchStore_estilos(codretail, namestore.namecolumn, namestore.namestore).then(function (infostore) {
            object = {};
            namestore = infostore.namestore;
            if (infostore.exists) {
                object.namecolumn = infostore.namecolumn;
                object.codstore = infostore.codstore;
                object.namestore = infostore.namestore;
                return storearrays.push(object);
            } else {
                console.log("No existe tienda : " + namestore + " en la BD!!.");
            }
        })
    }).then(function () {
        return storearrays;
    })
}
var searchStore_estilos = function (codretail, namecolumn, store) {
    return db.Tienda.find({
        where: {
            codRetail: codretail,
            descripcion: store
        }
    }).then(function (result) {
        var object = {};
        if (result == null) {
            object = {
                exists: false,
                namecolumn: namecolumn,
                namestore: store
            }
            return object;
        } else {
            object = {
                exists: true,
                namecolumn: namecolumn,
                codstore: result.codTienda,
                namestore: result.descripcion
            }
            return object;
        }
    })
}
var getAllSales_estilos = function (codretail, codperiod, stores, sheets, columndescription) {
    var rows = "", salearrays = [], eq_column = "", namestore = "", codstore = "", object = {};
    return new Promises.resolve(sheets).each(function (sheet) {
        rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
        return new Promises.resolve(stores).each(function (store) {
            codstore = store.codstore;
            eq_column = store.namecolumn;
            namestore = store.namestore;
            return new Promises.resolve(rows).each(function (row) {
                object = {};
                object.codretail = codretail;
                object.product = row[columndescription];
                object.sale = row[eq_column];
                object.codstore = store.codstore;
                object.namestore = store.namestore;
                object.period = codperiod;
                salearrays.push(object)
            });
        });
    }).then(function () {
        return salearrays;
    })
}
var getRecollectStores_ripley = function (sheets) {
    var rows = "", columnstores = "A", indexincrement = 10, arraysstore = [];
    return new Promises.resolve(sheets).each(function (sheet) {
        rows = workbook.Sheets[sheet];
        proccessRowsStores_ripley(rows, columnstores, indexincrement).then(function (results) {
            arraysstore = results;
        })
    }).then(function () {
        return arraysstore;
    });
}
var proccessRowsStores_ripley = function (rows, columnstores, indexincrement) {
    var namestore = "", storerow = "", contar = 0, lengthrow = "", namestoresplit = [], storearray = [], namestoresobject = {}, storesrepeat = [];
    return new Promises(function (resolve, reject) {
        lengthrow = Object.keys(rows).length;
        for (var i = 0; i < lengthrow; i++) {
            namestoresobject = {};
            if (indexincrement < lengthrow) {
                storerow = rows[columnstores + indexincrement];
                if (storerow) {
                    namestore = storerow.v;
                    namestoresplit = namestore.split(" ");
                    if (namestoresplit[0] != "Total") {
                        if (storesrepeat.indexOf(namestore.toUpperCase().trim()) == -1) {
                            if (namestore.toUpperCase().trim() != undefined) {
                                storesrepeat.push(namestore.toUpperCase().trim());
                                namestoresobject = {
                                    namestore: namestore.toUpperCase().trim()
                                }

                                storearray.push(namestoresobject);
                            }
                        }
                    }
                }
                indexincrement++;
            }
        }
        resolve(storearray);
    });
}
var getInfoStores_ripley = function (codretail, storesarray) {
    var namestore = "", object = {}, storearrays = [];
    return new Promises.resolve(storesarray).each(function (namestore) {
        return searchStore_ripley(codretail, namestore.namestore).then(function (infostore) {
            object = {};
            namestore = infostore.namestore;
            if (infostore.exists) {
                object.codstore = infostore.codstore;
                object.namestore = infostore.namestore;
                return storearrays.push(object);
            } else {
                console.log("No existe tienda : " + namestore + " en la BD!!.");
            }
        })
    }).then(function () {
        return storearrays;
    });
}
var searchStore_ripley = function (codretail, store) {
    return db.Tienda.find({
        where: {
            codRetail: codretail,
            descripcion: store
        }
    }).then(function (result) {
        var object = {};
        if (result == null) {
            object = {
                exists: false,
                namestore: store
            }
            return object;
        } else {
            object = {
                exists: true,
                codstore: result.codTienda,
                namestore: result.descripcion
            }
            return object;
        }
    })
}
var getAllSales_ripley = function (codretail, codperiod, stores, sheets, columndescription, columnsale) {
    var rows = "", salesarray = [];
    return new Promises.resolve(sheets).each(function (sheet) {
        rows = workbook.Sheets[sheet];
        return processRowsSale_ripley(codretail, codperiod, stores, rows, columndescription, columnsale).then(function (result) {
            salesarray = result;
        });
    }).then(function () {
        console.log("FUERA: " + salesarray.length);
        return salesarray;
    })
}
var processRowsSale_ripley = function (codretail, codperiod, stores, rows, columndescription, columnsale) {
    var codstore = "", namestore = "", lengthrow = "",
        storerow = "", productrow = "", salerow = "",
        storesplit = "", productsplit = "", rowsale = "", salesarray = [],
        object = {}, storesplit = "", storetotal = "";
    /** Esta promesa falta mejorar  (muchos if) */
    return new Promises(function (resolve, reject) {
        lengthrow = Object.keys(rows).length;
        stores.forEach(function (store) {
            codstore = store.codstore;
            namestore = store.namestore;
            console.log("1. TIENDA RECORRIENDO: " + namestore);
            console.log("2. CODSTORE RECORRIENDO: " + codstore + " NAMESTORE RECORRIENDO: " + namestore);

            for (var i = 0; i < lengthrow; i++) {
                if (i > 9) {
                    //console.log("3. row " + i + " DE " + lengthrow + " | " + namestore);
                    storerow = rows["A" + i];
                    productrow = rows[columndescription + i];
                    salerow = rows[columnsale + i];
                    if (storerow != undefined) {
                        //console.log("4. ROW Tienda: " + storerow.v.toUpperCase().trim() + " | DE " + namestore);
                        storesplit = storerow.v.split(" ");
                        storetotal = storesplit[0];
                        if (storetotal.trim() != "Total") {
                            //console.log("5. ROW Tienda sin Total: " + storerow.v.toUpperCase().trim() + " | DE " + namestore);
                            if(storerow.v.toUpperCase().trim() == namestore){
                                if (productrow != undefined) {
                                    productsplit = productrow.v.split(" ");
                                    if (productsplit[0] == "Total") {
                                        //console.log("6. ROW Tienda sin Total: " + storerow.v.toUpperCase().trim() + " | PRODUCTO: " + productrow.v.substring(6).trim() + " | DE " + namestore);
                                        if (salerow) {
                                            rowsale = salerow.v;
                                        } else {
                                            rowsale = 0;
                                        }

                                        object = {
                                            codretail: codretail,
                                            product: productrow.v.substring(6).trim(),
                                            sale: rowsale,
                                            codstore: codstore,
                                            namestore: namestore,
                                            period: codperiod
                                        }

                                        salesarray.push(object);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
        console.log("TERMINO: " + salesarray.length);
        resolve(salesarray)
    })
}
var searchSaleEffective = function (sale) {
    var salesold = "", salenew = "", sumsale = "";
    return db.VentaEfectiva.find({
        where: {
            codRetail: sale.codretail,
            codTienda: sale.codstore,
            codProducto: sale.id,
            codPeriodo: sale.period,
            codLinea: sale.codlinea
        }
    }).then(function (result) {

        var object = {};
        if (result == null) {
            object = {
                exists: false,
                codsale: null,
                codstore: sale.codstore,
                idprod: sale.id,
                idline: sale.codlinea,
                price: sale.preciocosto,
                pvd: sale.pvd,
                codretail: sale.codretail,
                codperiod: sale.period,
                sale: sale.sale
            }
            return object;
        } else {

            salesold = result.dataValues.cantidad;
            salenew = sale.sale;
            sumsale = parseInt(salesold) + parseInt(salenew);

            /** Nota: Aun no esta definido la logica cuando la venta efectiva es un -1 (no se sabe si significa una devolucion de la venta?) ,
             *  (o si se restara la venta efectiva anterior o simplement no se sumara  ni agregara)*/

            object = {
                exists: true,
                codsale: result.dataValues.codVenta,
                codstore: result.dataValues.codTienda,
                idprod: result.dataValues.codProducto,
                idline: result.dataValues.codLinea,
                price: result.dataValues.precioCosto,
                pvd: result.dataValues.precioPVD,
                codretail: result.dataValues.codRetail,
                codperiod: result.dataValues.codPeriodo,
                sale: sumsale
            }

            return object;
        }
    })
}
var createSaleEffective = function (codmax, sale, date) {
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
        cantidad: parseInt(sale.sale),
        indBloqueado: "N",
        indEliminado: "N",
        codJefe: null,
        codLinea: sale.idline,
        margen: parseFloat("0.00"),
        codPeriodo: sale.codperiod,
        precioCosto: sale.price,
        precioPVD: sale.pvd,
        codProducto: sale.idprod,
        codRetail: sale.codretail,
        codSupervisor: null,
        codTienda: sale.codstore,
        totalCosto: parseFloat("0.00"),
        totalPVD: parseFloat("0.00"),
        codVendedor: null
    }).then(function (createventaefectiva) {
        return createventaefectiva;
    })
}
var updateSaleEffective = function (sale, date) {
    return db.VentaEfectiva.update({
        precioCosto: sale.price,
        PrecioPVD: sale.pvd,
        cantidad: sale.sale,
        audFechaModifica: date
    }, {
        where: {
            codVenta: sale.codsale
        }
    }).then(function (updateventaefectiva) {
        return updateventaefectiva;
    })
}
var codFormat = function (format, cod) {
    var countformat = format.length;
    return (format + cod).slice(-countformat);
}
