'use strict';
var XLSX = require('xlsx'),
    FS = require("fs"),
    Promises = require('bluebird'),
    db = require('./database'),
    moment = require('moment'),
    now = moment(),
    dateNow = now.toDate(),
    workbook = "",
    pruebaequivalencia = {},
    codmaxsaleffective = "",
    storenamearrays = [];

module.exports = {
    readFileXLS: function readfilexls(pathfile, validatesheet) {
        return readFileXLS(pathfile, validatesheet);
    },
    getCodMaxSale: function getcodmaxsale() {
        return getCodMaxSale();
    },
    getPeriod: function getperiod(month, year) {
        return getPeriod(month, year);
    },
    getInfoRetail: function getinforetail(nameretail) {
        return getInfoRetail(nameretail);
    },
    getInfoStores: function getinfostores(codretail, storesarray) {
        return getInfoStores(codretail, storesarray);
    },
    searchStore: function searchstore(codretail, store) {
        return searchStore(codretail, store);
    },
    getAllSales_standard: function getallsales_standard(codretail, codperiod, stores, columndescription, columnsale) {
        return getAllSales_standard(codretail, codperiod, stores, columndescription, columnsale);
    },
    getEnabledProducts: function getenabledproducts(sales) {
        return getEnabledProducts(sales);
    },
    processSearchProduct: function processsearchproduct(sales) {
        return processSearchProduct(sales);
    },
    searchProductByCod: function searchproductbycod(cod, sales) {
        return searchProductByCod(cod, sales);
    },
    getFilterProductRepeat: function getfilterproductrepeat(sales) {
        return getFilterProductRepeat(sales);
    },
    proccessSales: function proccesssales(sales) {
        return proccessSales(sales);
    },
    searchSaleEffective: function searchsaleeffective(sale) {
        return searchSaleEffective(sale);
    },
    createSaleEffective: function createsaleeffective(codmax, sale, date) {
        return createSaleEffective(codmax, sale, date);
    },
    codFormat: function codformat(format, cod){
        return codFormat(format, cod);
    }
}

var readFileXLS = function readfilexls(pathfile, validatesheet) {
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
var getReadFile = function getreadfile(path) {
    return XLSX.readFile(path);
}
var getSheetToJson = function getrowjson(sheet) {
    var rows = "";
    return new Promises(function (resolve, reject) {
        rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
        resolve(rows);
    })
}
var getSheet = function getsheet(sheetarrrays, validatesheet) {
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
var getCodMaxSale = function getcodmaxsale() {
    return db.VentaEfectiva.max('codVenta').then(function (result) {
        var object = {};
        if (result != null) {
            codmaxsaleffective = result;
        }
    });
}
var getPeriod = function getperiod(month, year) {
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
var getInfoRetail = function getinforetail(nameretail) {
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
var getInfoStores = function getinfostores(codretail, storesarray) {
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
var searchStore = function searchstore(codretail, store) {
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
var getAllSales_standard = function getallsales(codretail, codperiod, stores, columndescription, columnsale) {
    var sales = "", codstore = "", namestore = "", namesheet = "", salearrays = [], description = "", sale = "", object = {};
    return Promises.resolve(stores).each(function (store) {
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
var getEnabledProducts = function getenablederoducts(sales) {
    var saleenabledarray = [];
    return new Promises.resolve(sales).each(function (sale) {
        return processSearchProduct(sale).then(function (result) {
            saleenabledarray.push(result);
        })
    }).then(function () {
        return saleenabledarray;
    })
}
var processSearchProduct = function processsearchproduct(sale) {
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
var searchProductByCod = function searchproductbycod(codstring, sale) {
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
var getFilterProductRepeat = function getfilterproductepeat(sales) {
    var salesarrays = [], nameproduct = [], productsarray = [], saleold = "", salenew = "", object = {}, index = "", sumsale = "";
    return new Promises.resolve(sales).each(function (sale) {
        nameproduct = sale.description;
        object = {};
        if (productsarray.indexOf(nameproduct) == -1) {
            productsarray.push(nameproduct);
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
            index = productsarray.indexOf(nameproduct);
            salenew = sale.sale;
            saleold = salesarrays[index].sale;
            sumsale = parseInt(saleold) + parseInt(salenew);
            salesarrays[index].sale = sumsale;
        }
    }).then(function () {
        return salesarrays;
    })
}
var proccessSales = function proccessSales(sales) {
    return new Promises.resolve(sales).each(function (sale) {
        if(sale.id != null){
            console.log("SIN NULL  : " + JSON.stringify(sale));
            searchSaleEffective(sale).then(function (result) {
                if (result.exists) {
                    console.log("SI : " + JSON.stringify(result));
                } else {
                    codmaxsaleffective++;
                    console.log("NO  : " + JSON.stringify(result));
                    createSaleEffective(codmaxsaleffective, result, dateNow).then(function (create) {
                        console.log("VENTA CREADA : " + create);
                    });
                }
            })
        }
    }).then(function () {

    });
}
var searchSaleEffective = function searchSaleEffective(sale) {

    //console.log("SALE + : " + JSON.stringify(sale));

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
                sale: result.dataValues.cantidad
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
var codFormat = function CodFormat(format, cod) {
    var countformat = format.length;
    return (format + cod).slice(-countformat);
}
