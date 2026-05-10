import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  addUser,
  getUserByUsername,
  getUser,
  getAcceptedFriends,
} from "../controller/users_controller";
import authMiddleware from "../middleware/auth";
import { socketService } from "../services/socket_service";

const router = Router();

router.post("/register", async (req: any, res: any) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username or Password not provided" });
    }

    const existingUser = await getUserByUsername(username);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const saltRounds = parseInt(process.env.SALT_ROUNDS || "10");
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await addUser(username, hashedPassword);
    return res
      .status(201)
      .json({ message: "User created", id: result.id, uid: result.uid });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req: any, res: any) => {
  try {
    const { username, password } = req.body;
    const userRows = await getUserByUsername(username);
    
    if (userRows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = userRows[0];
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        { id: user.id, uid: user.uid, username: user.username },
        process.env.SECRET_KEY as string,
        { expiresIn: "24h" }
      );
      return res.json({ token, id: user.id, uid: user.uid, username: user.username });
    }

    res.status(401).json({ message: "Invalid credentials" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route   GET /users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authMiddleware, async (req: any, res: any) => {
  try {
    const user = await getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route   POST /users/logout
 * @desc    Client-side logout (placeholder)
 * @access  Private
 */
router.post("/logout", authMiddleware, (req: any, res: any) => {
  res.json({ message: "Logged out successfully" });
});

/**
 * @route   GET /users/friends
 * @desc    Get accepted friend list with online status
 * @access  Private
 */
router.get("/friends", authMiddleware, async (req: any, res: any) => {
  try {
    const friends = await getAcceptedFriends(req.user.id);
    
    // Check online status for each friend
    const friendsWithStatus = await Promise.all(
      friends.map(async (f) => ({
        ...f,
        isOnline: await socketService.isUserOnline(f.friend_uid),
      }))
    );

    res.json({
      count: friendsWithStatus.length,
      friends: friendsWithStatus
    });
  } catch (error) {
    console.error("Friend list error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
