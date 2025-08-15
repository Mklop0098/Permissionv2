'use strict';

let tableName = 'evaluate';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'has_photo', { type: 'tinyint', defaultValue: 0}, function (err) {
    if (err) {
      console.error(`Error adding column has_photo:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'has_photo', function (err) {
    if (err) {
      console.error(`Error removing column has_photo:`, err);
      return callback(err);
    }
    callback();
  });
};