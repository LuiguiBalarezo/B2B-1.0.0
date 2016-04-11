'use strict';

function FileDuplicateError(err) {
  return err.fileDuplicate === true;
}

module.exports = FileDuplicateError;
