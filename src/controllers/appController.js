import axios from "axios";
import { db } from "../utils/firebaseAdmin.js";
import { getDistance } from "../utils/distance.js";


// Send help alert
export const sendHelp = async (req, res) => {
  try {
    const { userId, latitude, longitude, description } = req.body;

    if (!userId || !latitude || !longitude) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Save help request with description
    await db.collection("helpRequests").add({
      userId,
      latitude,
      longitude,
      description: description || "",
      timestamp: Date.now(),
    });

    // Fetch all user locations
    const usersSnap = await db.collection("userLocations").get();
    const tokens = [];

    usersSnap.forEach((doc) => {
      const u = doc.data();
      if (u.userId === userId) return;

      const distance = getDistance(latitude, longitude, u.latitude, u.longitude);
      if (distance < 1 && u.expoPushToken) {
        tokens.push(u.expoPushToken);
      }
    });

    // Send push notifications
    if (tokens.length > 0) {
      const messages = tokens.map((token) => ({
        to: token,
        title: "🚨 Tyst hjälpsignal",
        body: description
          ? `${description} behöver hjälp i närheten!`
          : "Någon i närheten behöver hjälp!",
        sound: "default",
        data: { screen: "HelpRequest" },
      }));

      await axios.post("https://exp.host/--/api/v2/push/send", messages);
      console.log(`✅ Notified ${tokens.length} nearby users`);
    }

    return res.status(200).json({ success: true, notified: tokens.length });
  } catch (err) {
    console.error("❌ Error sending help:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
