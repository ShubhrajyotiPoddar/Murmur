import db from "../config/db";

const addUser = async (
  username: string,
  password: string,
): Promise<{ id: number; uid: string }> => {
  const result = await db.query(
    `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, uid`,
    [username, password],
  );
  return { id: result.rows[0].id, uid: result.rows[0].uid };
};

const getUser = async (userID: number): Promise<any> => {
  const result = await db.query(`SELECT id, uid, username, created_at FROM users WHERE id = $1`, [userID]);
  return result.rows[0];
};

const getUserByUsername = async (username: string): Promise<any[]> => {
  const result = await db.query(`SELECT * FROM users WHERE username = $1`, [
    username,
  ]);
  return result.rows;
};

const GetUserHPassword = async (username: string): Promise<string> => {
  const result = await db.query(
    `SELECT password FROM users WHERE username = $1`,
    [username],
  );
  return result.rows[0]?.password || "";
};

const getUsernameById = async (userID: number): Promise<string> => {
  const result = await db.query("SELECT username FROM users WHERE id = $1", [
    userID,
  ]);
  return result.rows[0]?.username || "";
};

const getUserByUid = async (uid: string): Promise<any> => {
  const result = await db.query("SELECT * FROM users WHERE uid = $1", [uid]);
  return result.rows[0];
};

/**
 * Retrieves all accepted friends for a user.
 */
const getAcceptedFriends = async (userId: number): Promise<any[]> => {
  const sql = `
    SELECT 
      CASE 
        WHEN c.sender_id = $1 THEN u2.uid 
        ELSE u1.uid 
      END as friend_uid,
      CASE 
        WHEN c.sender_id = $1 THEN u2.username 
        ELSE u1.username 
      END as friend_username,
      c.id as connection_id,
      c.created_at as became_friends_at
    FROM connections c
    JOIN users u1 ON c.sender_id = u1.id
    JOIN users u2 ON c.receiver_id = u2.id
    WHERE (c.sender_id = $1 OR c.receiver_id = $1) 
    AND c.status = 'accepted'
  `;
  const result = await db.query(sql, [userId]);
  return result.rows;
};

const searchUsers = async (
  query: string,
  currentUserId: number,
): Promise<{ found: boolean; results: any[] }> => {
  let sql: string;
  let params: any[];

  const baseQuery = `
    SELECT u.uid, u.username, c.status as connection_status,
           CASE WHEN c.sender_id = $1 THEN true ELSE false END as is_sender
    FROM users u
    LEFT JOIN connections c ON (
        (c.sender_id = $1 AND c.receiver_id = u.id) OR 
        (c.sender_id = u.id AND c.receiver_id = $1)
    )
  `;

  if (query.length === 6) {
    // Both UID (exact) and Username (partial) search for 6-character strings
    sql = `${baseQuery} WHERE (u.uid = $2 OR u.username ILIKE $3) AND u.id != $1`;
    params = [currentUserId, query, `%${query}%`];
  } else {
    // Only partial username search for any other length
    sql = `${baseQuery} WHERE u.username ILIKE $2 AND u.id != $1`;
    params = [currentUserId, `%${query}%`];
  }

  const result = await db.query(sql, params);

  return {
    found: (result.rowCount ?? 0) > 0,
    results: result.rows,
  };
};

export {
  getUser,
  addUser,
  GetUserHPassword,
  getUserByUsername,
  getUsernameById,
  getUserByUid,
  getAcceptedFriends,
  searchUsers,
};
