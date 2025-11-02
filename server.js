import express from "express";
import axios from "axios";
import { db } from "./firebaseAdmin.js";

const app = express();
app.use(express.json());

app.post("/send-help", async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;

    await db.collection("helpRequests").add({
      userId,
      latitude,
      longitude,
      timestamp: Date.now(),
    });

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

    if (tokens.length > 0) {
      await axios.post("https://exp.host/--/api/v2/push/send", {
        to: tokens,
        title: "🚨 Silent Help Alert",
        body: "Someone near you needs help!",
        sound: "default",
      });
    }

    res.send({ success: true, notified: tokens.length });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error sending help");
  }
});

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

app.listen(3000, () => console.log("🚀 Server running on port 3000"));
