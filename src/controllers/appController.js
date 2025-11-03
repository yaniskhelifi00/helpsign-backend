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

    if (!userId || !latitude || !longitude)
      return res.status(400).send("Missing required fields");

    await db.collection("helpRequests").add({
      userId,
      latitude,
      longitude,
      timestamp: Date.now(),
    });

    // Get all user locations
    const usersSnap = await db.collection("userLocations").get();
    const tokens = [];

    usersSnap.forEach((doc) => {
      const u = doc.data();
      if (u.userId !== userId) {
        const distance = getDistance(latitude, longitude, u.latitude, u.longitude);
        if (distance < 1 && u.expoPushToken) {
          tokens.push(u.expoPushToken);
        }
      }
    });

    // Notify users
    if (tokens.length > 0) {
      await axios.post("https://exp.host/--/api/v2/push/send", {
        to: tokens,
        title: "🚨 Silent Help Alert",
        body: "Someone near you needs help!",
        sound: "default",
      });
      console.log(`Notified ${tokens.length} users`);
    }

    res.send({ success: true, notified: tokens.length });
  } catch (err) {
    console.error("Error sending help:", err);
    res.status(500).send("Error sending help");
  }
};
