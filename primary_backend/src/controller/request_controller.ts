import db from "../config/db";

/**
 * Adds a new connection request to the database.
 */
const addConnectionRequest = async (senderId: number, receiverId: number): Promise<void> => {
  await db.query(
    "INSERT INTO connections (sender_id, receiver_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [senderId, receiverId]
  );
};

/**
 * Checks if two users have an accepted connection.
 */
const areUsersFriends = async (user1Id: number, user2Id: number): Promise<boolean> => {
  const sql = `
    SELECT 1 FROM connections 
    WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
    AND status = 'accepted'
  `;
  const result = await db.query(sql, [user1Id, user2Id]);
  return (result.rowCount ?? 0) > 0;
};

/**
 * Retrieves all pending connection requests for a specific receiver.
 * Includes sender's uid and username for the frontend.
 */
const getPendingRequests = async (receiverId: number): Promise<any[]> => {
  const sql = `
    SELECT c.id, c.sender_id, u.uid as sender_uid, u.username as sender_username, c.created_at
    FROM connections c
    JOIN users u ON c.sender_id = u.id
    WHERE c.receiver_id = $1 AND c.status = 'pending'
    ORDER BY c.created_at DESC
  `;
  const result = await db.query(sql, [receiverId]);
  return result.rows;
};

/**
 * Updates the status of a connection request.
 */
const updateRequestStatus = async (requestId: number, status: 'accepted' | 'rejected'): Promise<void> => {
  await db.query(
    "UPDATE connections SET status = $1 WHERE id = $2",
    [status, requestId]
  );
};

/**
 * Retrieves a connection request by its ID.
 */
const getRequestById = async (requestId: number): Promise<any> => {
  const result = await db.query("SELECT * FROM connections WHERE id = $1", [requestId]);
  return result.rows[0];
};

export {
  addConnectionRequest,
  areUsersFriends,
  getPendingRequests,
  updateRequestStatus,
  getRequestById,
};
