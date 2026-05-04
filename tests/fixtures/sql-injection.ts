// Fixture: SQL injection via string concatenation
export async function getUserById(db: any, userId: string) {
  // BAD: SQL string concatenation
  const query = `SELECT * FROM users WHERE id = ${userId}`;
  return db.query(query);
}

export async function searchUsers(db: any, name: string) {
  // BAD: raw query with interpolation
  return db.raw(`SELECT * FROM users WHERE name LIKE '%${name}%'`);
}
