'use strict';

let tableName = 'report';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'detail', { type: 'text', notNull: true}, function (err) {
    if (err) {
      console.error(`Error adding column has_photo:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'detail', function (err) {
    if (err) {
      console.error(`Error removing column detail:`, err);
      return callback(err);
    }
    callback();
  });
};