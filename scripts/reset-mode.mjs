import { createClient } from "@libsql/client";
import path from "path";

const url = `file:${path.join(process.cwd(), "data", "moc.db").replace(/\\/g, "/")}`;
const db = createClient({ url });
const now = new Date().toISOString();

await db.execute({
  sql: `UPDATE settings SET mode = 'inscription', updated_at = ?, mixer_at = NULL WHERE id = 1`,
  args: [now],
});

await db.execute(`UPDATE participants SET selected = 0`);

const r = await db.execute(`SELECT mode, updated_at, mixer_at FROM settings WHERE id = 1`);
console.log(r.rows[0]);
