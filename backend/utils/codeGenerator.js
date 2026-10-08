const pool = require('../config/db');

async function generateCode(prefix, tableName, columnCode) {
  try {
    const [rows] = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    const nextNum = (rows[0].count || 0) + 1001;
    let code = `${prefix}-${nextNum}`;

    // Verify uniqueness
    let [exists] = await pool.query(`SELECT 1 FROM ${tableName} WHERE ${columnCode} = ?`, [code]);
    let counter = 1;
    while (exists.length > 0) {
      code = `${prefix}-${nextNum + counter}`;
      [exists] = await pool.query(`SELECT 1 FROM ${tableName} WHERE ${columnCode} = ?`, [code]);
      counter++;
    }
    return code;
  } catch (err) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomSuffix}`;
  }
}

module.exports = {
  generateCode
};
