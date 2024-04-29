import { initializeApp } from 'firebase-admin/app';
import { getMessaging } from "firebase-admin/messaging";
import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import serviceAccount from "./serverkey.json" assert { type: "json" };

const app = express();
app.use(express.json());
app.use(cors());

app.use(function(req, res, next) {
  res.setHeader("Content-Type", "application/json");
  next();
});

initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'notification-c9eb3',
});

app.post("/send", function (req, res) {
  const receivedToken = req.body.fcmToken;
  
  if (!receivedToken) {
    return res.status(400).json({ error: "FCM token is required" });
  }
  
  const message = {
    notification: {
      title: "Notif",
      body: 'This is a Test Notification'
    },
    token: receivedToken, // Use received token dynamically
  };
  
  getMessaging()
    .send(message)
    .then((response) => {
      res.status(200).json({
        message: "Successfully sent message",
        token: receivedToken,
      });
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      res.status(400).json({ error: error.message });
      console.log("Error sending message:", error);
    });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
}); 
