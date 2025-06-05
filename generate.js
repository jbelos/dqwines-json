/**
 * generate.js
 *
 * Connects to your InfinityFree MySQL, queries the `wines` table (plus category_name),
 * then writes that as JSON in ./wines.json.
 *
 * This script expects four environment variables (set in GitHub Secrets):
 *   DB_HOST, DB_USER, DB_PASS, DB_NAME
 */

const mysql = require('mysql2/promise');
const fs    = require('fs').promises;

(async () => {
  // 1) Read MySQL credentials from environment
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const pass = process.env.DB_PASS;
  const name = process.env.DB_NAME;

  if (!host || !user || !pass || !name) {
    console.error('❌ Missing one of DB_HOST / DB_USER / DB_PASS / DB_NAME');
    process.exit(1);
  }

  let connection;
  try {
    // 2) Connect to InfinityFree MySQL (be sure remote MySQL is allowed in your control panel)
    connection = await mysql.createConnection({
      host,
      user,
      password: pass,
      database: name,
      port: 3306,         // InfinityFree’s default MySQL port is 3306
      ssl  :   false,     // InfinityFree doesn’t use SSL on shared MySQL
      connectTimeout: 10000
    });

    // 3) Query data (same columns as your table)
    const [rows] = await connection.execute(`
      SELECT
        w.SKU            AS sku,
        w.wine_name      AS name,
        w.unit_price     AS price,
        w.vintage        AS vintage,
        IFNULL(c.category_name,'') AS category,
        w.region         AS region,
        w.variety        AS variety,
        w.stock          AS stock,
        w.image_url      AS image_url,
        w.description    AS description,
        w.status         AS status
      FROM wines w
      LEFT JOIN categories c
        ON w.category_id = c.category_id
      ORDER BY w.wine_name;
    `);

    // 4) Dump to wines.json (pretty‐printed)
    await fs.writeFile('wines.json', JSON.stringify(rows, null, 2), 'utf8');
    console.log(`✅ Wrote ${rows.length} rows to wines.json`);
  } catch (e) {
    console.error('❌ Error generating JSON:', e);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
})();
