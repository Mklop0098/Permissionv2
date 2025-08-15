'use strict';
let tableName = 'evaluate';

exports.up = function (db, callback) {
  db.createTable(tableName, {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    product_id: { type: 'int', notNull: true },
    order_id: { type: 'int', notNull: true },
    customer_id: { type: 'int', notNull: true },
    seller_id: { type: 'int', notNull: true },
    rating: { type: 'decimal(10,1)', defaultValue: 5.0 },
    comment: { type: 'text' },
    usefull: { type: 'int', defaultValue: 0 },
    seller_reply: { type: 'text' },
    source: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
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
