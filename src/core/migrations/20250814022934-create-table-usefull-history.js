'use strict';
let tableName = 'like_rate_history';

exports.up = function (db, callback) {
  db.createTable(tableName, {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    evaluate_id: { type: 'int', notNull: true },
    product_id: { type: 'int', notNull: true },
    customer_id: { type: 'int', notNull: true },
    like: { type: 'tinyint', defaultValue: 0 },
    source: { type: 'varchar(255)', notNull: true },
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
