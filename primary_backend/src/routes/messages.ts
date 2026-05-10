import { Router } from "express";
import path from "path";
import fs from "fs";
import { getUserByUid } from "../controller/users_controller";
import { 
  findOrCreateConversation, 
  insertMessage, 
  updateMessage,
  softDeleteMessage,
  getMessagesByConversation, 
  getConversationsForUser,
  getMessageById,
  isUserInConversation 
} from "../controller/message_controller";
import { areUsersFriends } from "../controller/request_controller";
import authMiddleware from "../middleware/auth";
import upload from "../middleware/upload";
import { socketService } from "../services/socket_service";
import db from "../config/db";

const router = Router();

const UPLOAD_BASE_DIR = path.join(__dirname, "../../uploaded-files");

/**
 * Utility to handle Database Trigger Exceptions
 */
const handleDbError = (error: any, res: any) => {
  const msg = error.message || "";

  // Log the full detail ONLY on the server console
  console.error("Database Error Detail:", error);

  if (msg.includes("not part of conversation") || msg.includes("enforce_connection")) {
    // Send a clean, pre-defined message without the raw 'msg'
    return res.status(403).json({ 
      message: "Security violation: You are not authorized to perform this action." 
    });
  }

  res.status(500).json({ message: "An unexpected error occurred." });
};

/**
 * Helper to get the other person in a conversation
 */
const getRecipientUid = async (conversationId: number, currentUserId: number) => {
  const conv = await db.query("SELECT user1_id, user2_id FROM conversations WHERE id = $1", [conversationId]);
  if (!conv.rows[0]) return null;
  const targetId = conv.rows[0].user1_id === currentUserId ? conv.rows[0].user2_id : conv.rows[0].user1_id;
  const user = await db.query("SELECT uid FROM users WHERE id = $1", [targetId]);
  return user.rows[0]?.uid;
};

/**
 * @route   POST /messages/conversation
 * @desc    Find or create a conversation with a target user
 * @access  Private
 */
router.post("/conversation", authMiddleware, async (req: any, res: any) => {
  try {
    const { targetUid } = req.body;
    const senderId = req.user.id;

    if (!targetUid) {
      return res.status(400).json({ message: "targetUid is required" });
    }

    const targetUser = await getUserByUid(targetUid);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const conversationId = await findOrCreateConversation(senderId, targetUser.id);

    res.json({
      conversation_id: conversationId,
      other_uid: targetUser.uid,
      other_username: targetUser.username
    });
  } catch (error) {
    handleDbError(error, res);
  }
});

/**
 * @route   POST /messages/upload
 */
router.post("/upload", authMiddleware, upload.single("file"), async (req: any, res: any) => {
  try {
    const { targetUid } = req.body;
    const senderId = req.user.id;
    const file = req.file;

    if (!file || !targetUid) {
      if (file) fs.unlinkSync(file.path);
      return res.status(400).json({ message: "File and targetUid are required" });
    }

    const targetUser = await getUserByUid(targetUid);
    if (!targetUser) {
      fs.unlinkSync(file.path);
      return res.status(404).json({ message: "Recipient not found" });
    }

    const connected = await areUsersFriends(senderId, targetUser.id);
    if (!connected) {
      fs.unlinkSync(file.path);
      return res.status(403).json({ message: "You must be friends to send files" });
    }

    const conversationId = await findOrCreateConversation(senderId, targetUser.id);

    const message = await insertMessage(
      conversationId,
      senderId,
      `Shared a file: ${file.originalname}`,
      'file',
      file.originalname,
      file.size,
      file.mimetype
    );

    const finalDir = path.join(UPLOAD_BASE_DIR, String(conversationId));
    if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });

    const finalName = `${message.id}_${file.originalname}`;
    const finalPath = path.join(finalDir, finalName);
    fs.renameSync(file.path, finalPath);

    socketService.notifyUser(targetUid, process.env.EVENT_NEW_MESSAGE || "new_message", {
      ...message,
      sender_uid: req.user.uid,
      sender_username: req.user.username,
    });

    return res.json({
      message: "File uploaded successfully",
      conversationId,
      sentMessage: message
    });

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    handleDbError(error, res);
  }
});

/**
 * @route   POST /messages/send
 */
router.post("/send", authMiddleware, async (req: any, res: any) => {
  try {
    const { targetUid, content } = req.body;
    const senderId = req.user.id;

    if (!targetUid || !content) {
      return res.status(400).json({ message: "Target UID and content are required" });
    }

    const targetUser = await getUserByUid(targetUid);
    if (!targetUser) {
      return res.status(404).json({ message: "Recipient user not found" });
    }

    if (senderId === targetUser.id) {
      return res.status(400).json({ message: "You cannot message yourself" });
    }

    const connected = await areUsersFriends(senderId, targetUser.id);
    if (!connected) {
      return res.status(403).json({ message: "You must be friends to send messages" });
    }

    const conversationId = await findOrCreateConversation(senderId, targetUser.id);
    const message = await insertMessage(conversationId, senderId, content);

    socketService.notifyUser(targetUid, process.env.EVENT_NEW_MESSAGE || "new_message", {
      ...message,
      sender_uid: req.user.uid,
      sender_username: req.user.username,
    });

    return res.json({
      message: "Message sent",
      conversationId,
      sentMessage: message,
    });
  } catch (error) {
    handleDbError(error, res);
  }
});

/**
 * @route   PATCH /messages/:messageId
 */
router.patch("/:messageId", authMiddleware, async (req: any, res: any) => {
  try {
    const { content } = req.body;
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await getMessageById(messageId);
    if (!message || message.sender_id !== userId) {
      return res.status(403).json({ message: "Unauthorized or message not found" });
    }

    if (message.type === 'file') {
      return res.status(400).json({ message: "Cannot edit file messages" });
    }

    const updated = await updateMessage(messageId, content);

    const recipientUid = await getRecipientUid(updated.conversation_id, userId);
    if (recipientUid) {
      socketService.notifyUser(recipientUid, process.env.EVENT_MESSAGE_UPDATED || "message_updated", {
        id: updated.id,
        conversation_id: updated.conversation_id,
        content: updated.content
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route   DELETE /messages/:messageId
 */
router.delete("/:messageId", authMiddleware, async (req: any, res: any) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await getMessageById(messageId);
    if (!message || message.sender_id !== userId) {
      return res.status(403).json({ message: "Unauthorized or message not found" });
    }

    const deleted = await softDeleteMessage(messageId);

    if (message.type === 'file') {
      const fileName = `${message.id}_${message.file_name}`;
      const filePath = path.join(UPLOAD_BASE_DIR, String(message.conversation_id), fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const recipientUid = await getRecipientUid(deleted.conversation_id, userId);
    if (recipientUid) {
      socketService.notifyUser(recipientUid, process.env.EVENT_MESSAGE_DELETED || "message_deleted", {
        id: deleted.id,
        conversation_id: deleted.conversation_id
      });
    }

    res.json({ message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route   GET /messages/download/:messageId
 */
router.get("/download/:messageId", authMiddleware, async (req: any, res: any) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const userId = req.user.id;

    const message = await getMessageById(messageId);
    if (!message || message.type !== 'file' || message.is_deleted) {
      return res.status(404).json({ message: "File not available" });
    }

    const authorized = await isUserInConversation(userId, message.conversation_id);
    if (!authorized) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const fileName = `${message.id}_${message.file_name}`;
    const filePath = path.join(UPLOAD_BASE_DIR, String(message.conversation_id), fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Physical file missing" });
    }

    res.download(filePath, message.file_name);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route   GET /messages/inbox
 */
router.get("/inbox", authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const conversations = await getConversationsForUser(userId);

    const conversationsWithStatus = await Promise.all(
      conversations.map(async (c) => ({
        ...c,
        isOnline: await socketService.isUserOnline(c.other_uid),
      }))
    );

    return res.json({
      count: conversationsWithStatus.length,
      conversations: conversationsWithStatus,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route   GET /messages/:conversationId
 */
router.get("/:conversationId", authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const conversationId = parseInt(req.params.conversationId);
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    const isAuthorized = await isUserInConversation(userId, conversationId);
    if (!isAuthorized) {
      return res.status(403).json({ message: "You are not authorized" });
    }

    const messages = await getMessagesByConversation(conversationId, limit, offset);

    return res.json({
      count: messages.length,
      limit,
      offset,
      messages,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
