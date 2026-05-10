import db from "../config/db";

/**
 * Finds an existing conversation between two users or creates a new one.
 */
const findOrCreateConversation = async (user1Id: number, user2Id: number): Promise<number> => {
  const findSql = `
    SELECT id FROM conversations 
    WHERE (user1_id = $1 AND user2_id = $2) 
       OR (user1_id = $2 AND user2_id = $1)
  `;
  const existing = await db.query(findSql, [user1Id, user2Id]);

  if (existing.rowCount && existing.rowCount > 0) {
    return existing.rows[0].id;
  }

  const createSql = `
    INSERT INTO conversations (user1_id, user2_id) 
    VALUES ($1, $2) 
    RETURNING id
  `;
  const result = await db.query(createSql, [user1Id, user2Id]);
  return result.rows[0].id;
};

/**
 * Inserts a new message (text or file) into the database.
 */
const insertMessage = async (
  conversationId: number, 
  senderId: number, 
  content: string, 
  type: 'text' | 'file' = 'text',
  fileName?: string,
  fileSize?: number,
  mimeType?: string
): Promise<any> => {
  const sql = `
    INSERT INTO messages (conversation_id, sender_id, content, type, file_name, file_size, mime_type) 
    VALUES ($1, $2, $3, $4, $5, $6, $7) 
    RETURNING *
  `;
  const result = await db.query(sql, [conversationId, senderId, content, type, fileName, fileSize, mimeType]);
  return result.rows[0];
};

/**
 * Updates the content of a message.
 */
const updateMessage = async (messageId: number, content: string): Promise<any> => {
  const sql = `UPDATE messages SET content = $1 WHERE id = $2 RETURNING *`;
  const result = await db.query(sql, [content, messageId]);
  return result.rows[0];
};

/**
 * Soft deletes a message.
 */
const softDeleteMessage = async (messageId: number): Promise<any> => {
  const sql = `UPDATE messages SET is_deleted = true WHERE id = $1 RETURNING *`;
  const result = await db.query(sql, [messageId]);
  return result.rows[0];
};

/**
 * Retrieves messages for a conversation with pagination.
 */
const getMessagesByConversation = async (conversationId: number, limit: number, offset: number): Promise<any[]> => {
  const sql = `
    SELECT m.id, m.sender_id, u.uid as sender_uid, u.username as sender_username, 
           m.content, m.is_read, m.created_at, m.type, m.file_name, m.file_size, m.mime_type,
           m.is_deleted
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = $1
    ORDER BY m.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const result = await db.query(sql, [conversationId, limit, offset]);
  return result.rows;
};

/**
 * Retrieves all conversations for a user with the latest message.
 */
const getConversationsForUser = async (userId: number): Promise<any[]> => {
  const sql = `
    SELECT 
      c.id as conversation_id,
      CASE WHEN c.user1_id = $1 THEN u2.uid ELSE u1.uid END as other_uid,
      CASE WHEN c.user1_id = $1 THEN u2.username ELSE u1.username END as other_username,
      m.content as last_message,
      m.type as last_message_type,
      m.created_at as last_message_at,
      m.is_deleted as last_message_deleted
    FROM conversations c
    JOIN users u1 ON c.user1_id = u1.id
    JOIN users u2 ON c.user2_id = u2.id
    LEFT JOIN LATERAL (
      SELECT content, type, created_at, is_deleted 
      FROM messages 
      WHERE conversation_id = c.id 
      ORDER BY created_at DESC 
      LIMIT 1
    ) m ON true
    WHERE c.user1_id = $1 OR c.user2_id = $1
    ORDER BY m.created_at DESC NULLS LAST
  `;
  const result = await db.query(sql, [userId]);
  return result.rows;
};

/**
 * Retrieves a single message by ID.
 */
const getMessageById = async (messageId: number): Promise<any> => {
  const result = await db.query("SELECT * FROM messages WHERE id = $1", [messageId]);
  return result.rows[0];
};

/**
 * Verifies if a user is part of a conversation.
 */
const isUserInConversation = async (userId: number, conversationId: number): Promise<boolean> => {
  const sql = `
    SELECT id FROM conversations 
    WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
  `;
  const result = await db.query(sql, [conversationId, userId]);
  return (result.rowCount ?? 0) > 0;
};

export {
  findOrCreateConversation,
  insertMessage,
  updateMessage,
  softDeleteMessage,
  getMessagesByConversation,
  getConversationsForUser,
  getMessageById,
  isUserInConversation,
};
