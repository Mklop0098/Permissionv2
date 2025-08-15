'use strict';
let tableName = 'report_reason';

exports.up = function (db, callback) {
  db.createTable(tableName, {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    reason: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create ' + tableName + ' table:', err);
      return callback(err);
    }
    callback();
  });
};
exports.down = function (db, callback) {
  db.dropTable(tableName, function (err) {
    if (err) {
      console.error('err drop ' + tableName + ' table:', err);
      return callback(err);
    }
    callback();
  });
};
