import axios from "axios";
import { db } from "../utils/firebaseAdmin.js";
import { getDistance } from "../utils/distance.js";

// Update user location
export const updateLocation = async (req, res) => {
  try {
    const { userId, latitude, longitude, expoPushToken } = req.body;

    if (!userId || !latitude || !longitude)
      return res.status(400).send("Missing required fields");

    await db.collection("userLocations").doc(userId).set({
      userId,
      latitude,
      longitude,
      expoPushToken,
      updatedAt: Date.now(),
    });

    res.send({ success: true });
  } catch (err) {
    console.error("Error updating location:", err);
    res.status(500).send("Error updating location");
  }
};

// Send help alert
export const sendHelp = async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;

    // Validation
    if (!userId || !latitude || !longitude) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Save help request
    await db.collection("helpRequests").add({
      userId,
      latitude,
      longitude,
      timestamp: Date.now(),
    });

    // Fetch all user locations
    const usersSnap = await db.collection("userLocations").get();
    const tokens = [];

    usersSnap.forEach((doc) => {
      const u = doc.data();

      // Skip sender
      if (u.userId === userId) return;

      // Check distance (within 1 km)
      const distance = getDistance(latitude, longitude, u.latitude, u.longitude);
      if (distance < 1 && u.expoPushToken) {
        tokens.push(u.expoPushToken);
      }
    });

    // Send push notifications to nearby users
    if (tokens.length > 0) {
      const messages = tokens.map((token) => ({
        to: token,
        title: "🚨 Silent Help Alert",
        body: "Someone near you needs help! Tap to open the app.",
        sound: "default",
        data: { screen: "HelpRequest" },
      }));

      await axios.post("https://exp.host/--/api/v2/push/send", messages);
      console.log(`✅ Notified ${tokens.length} nearby users`);
    }

    return res.status(200).json({
      success: true,
      notified: tokens.length,
    });
  } catch (err) {
    console.error("❌ Error sending help:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};