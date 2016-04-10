'use strict';

var cellRegexp = /^(\D+)(\d+)$/i;

exports.EXCEL_CELL_REGEX = cellRegexp;

exports.sortExcelFields = function(arr) {
  return (
    arr.sort(function(a, b) {
      var cellInfoA = cellRegexp.exec(a),
          cellInfoB = cellRegexp.exec(b),
          cellLetterA = cellInfoA[1].trim().toUpperCase(),
          cellLetterB = cellInfoB[1].trim().toUpperCase(),
          cellNumberA = parseInt(cellInfoA[2], 10),
          cellNumberB = parseInt(cellInfoB[2], 10),
          charSumA = 0,
          charSumB = 0;

      Array.prototype.forEach.call(cellLetterA, function(char) {
        charSumA += char.charCodeAt();
      });

      Array.prototype.forEach.call(cellLetterB, function(char) {
        charSumB += char.charCodeAt();
      });

      if (cellNumberA < cellNumberB) {
        return -1;
      } else if (cellNumberA > cellNumberB) {
        return 1;
      }

      // if same number, evaluate by characters
      if (cellNumberA === cellNumberB) {
        if (charSumA < charSumB) {
          return -1;
        } else if (charSumA > charSumB) {
          return 1;
        }
      }

      return 0;
    })
  );
};
