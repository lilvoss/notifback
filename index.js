import {initializeApp, applicationDefault } from 'firebase-admin/app';
import { getMessaging } from "firebase-admin/messaging";
import express, { json } from "express";
import cors from "cors";
import admin from "firebase-admin";
import serviceAccount from "./serverkey.json" assert { type: "json" };


process.env.GOOGLE_APPLICATION_CREDENTIALS;

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);

app.use(
  cors({
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);

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
    console.log("Received FCM Token:", receivedToken);
  
    // Construct the message object with the received FCM token
    const message = {
      notification: {
        title: "Notif",
        body: 'This is a Test Notification'
      },
      token: receivedToken, // Use the received FCM token dynamically
    };
  
    // Send the notification
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
        res.status(400);
        res.send(error);
        console.log("Error sending message:", error);
      });
  });

app.post("/sendToken", function (req, res) {
    const receivedToken = req.body.fcmToken;
    console.log("Received FCM Token:", receivedToken);
    
    // Here you can store the token in your database or perform any other actions
    
    res.status(200).json({ message: "FCM token received successfully" });
  });

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
