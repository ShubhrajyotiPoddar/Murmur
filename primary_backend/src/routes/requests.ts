import { Router } from "express";
import { searchUsers, getUserByUid, getUsernameById } from "../controller/users_controller";
import { addConnectionRequest, getPendingRequests, updateRequestStatus, getRequestById } from "../controller/request_controller";
import authMiddleware from "../middleware/auth";
import { socketService } from "../services/socket_service";
import db from "../config/db";

const router = Router();

/**
 * @route   GET /requests/search?query=...
 * @desc    Search for users by username or UID
 * @access  Private
 */
router.get("/search", authMiddleware, async (req: any, res: any) => {
  try {
    const query = req.query.query as string;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const { found, results } = await searchUsers(query, req.user.id);

    return res.json({
      found,
      count: results.length,
      users: results,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route   POST /requests/request
 * @desc    Send a connection request to a user by their UID
 * @access  Private
 */
router.post("/request", authMiddleware, async (req: any, res: any) => {
  try {
    const { targetUid } = req.body;
    const senderId = req.user.id;
    const senderUid = req.user.uid;
    const senderUsername = req.user.username;

    if (!targetUid) {
      return res.status(400).json({ message: "Target user UID is required" });
    }

    const targetUser = await getUserByUid(targetUid);
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    if (senderId === targetUser.id) {
      return res.status(400).json({ message: "You cannot send a request to yourself" });
    }

    await addConnectionRequest(senderId, targetUser.id);

    // Notify target user via WebSocket
    socketService.notifyUser(targetUid, process.env.EVENT_NEW_CONNECTION_REQUEST || "new_connection_request", {
      senderUid,
      senderUsername,
    });

    return res.json({ message: "Connection request sent successfully" });
  } catch (error) {
    console.error("Request error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route   GET /requests/pending
 * @desc    Retrieve all pending connection requests for the current user
 * @access  Private
 */
router.get("/pending", authMiddleware, async (req: any, res: any) => {
  try {
    const receiverId = req.user.id;
    const requests = await getPendingRequests(receiverId);

    return res.json({
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Get pending requests error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route   PATCH /requests/respond
 * @desc    Accept or reject a connection request
 * @access  Private
 */
router.patch("/respond", authMiddleware, async (req: any, res: any) => {
  try {
    const { requestId, status } = req.body;
    const receiverId = req.user.id;
    const receiverUsername = req.user.username;

    if (!requestId || !status) {
      return res.status(400).json({ message: "Request ID and status are required" });
    }

    if (status !== 'accepted' && status !== 'rejected') {
      return res.status(400).json({ message: "Status must be 'accepted' or 'rejected'" });
    }

    const request = await getRequestById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Connection request not found" });
    }

    if (request.receiver_id !== receiverId) {
      return res.status(403).json({ message: "You are not authorized to respond to this request" });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Request has already been ${request.status}` });
    }

    await updateRequestStatus(requestId, status);

    // Get sender's UID to notify them
    const senderResult = await db.query("SELECT uid FROM users WHERE id = $1", [request.sender_id]);
    const senderUid = senderResult.rows[0]?.uid;

    if (senderUid) {
      socketService.notifyUser(senderUid, process.env.EVENT_CONNECTION_RESPONSE || "connection_response", {
        requestId,
        status,
        responderUsername: receiverUsername,
      });
    }

    return res.json({ message: `Connection request ${status} successfully` });
  } catch (error) {
    console.error("Respond to request error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
