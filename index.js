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
  databaseURL: "https://notification-c9eb3-default-rtdb.firebaseio.com/"
});


const db = admin.firestore();


app.post("/save-token", async (req, res) => {
  try {
    const fcmToken = req.body.fcmToken;
    if (!fcmToken) {
      return res.status(400).json({ error: "FCM token is required" });
    }

    // Check if any document exists in the collection
    const tokensSnapshot = await db.collection("tokens").get();
    let tokenExists = false;

    tokensSnapshot.forEach(doc => {
      if (doc.data().token === fcmToken) {
        // If the same token already exists, set tokenExists to true
        tokenExists = true;
      }
    });

    if (tokenExists) {
      return res.status(200).json({ message: "Token already exists" });
    } else {
      // Save the token in the database
      await db.collection("tokens").add({ token: fcmToken });
      return res.status(200).json({ message: "Token saved successfully" });
    }
  } catch (error) {
    console.error("Error saving token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/send", async function (req, res) {
  try {
    const message = {
      notification: {
        title: "Notif",
        body: 'This is a Test Notification'
      }
    };

    // Get all tokens from the database
    const tokensSnapshot = await db.collection("tokens").get();
    const tokens = [];

    tokensSnapshot.forEach(doc => {
      tokens.push(doc.data().token);
    });

    console.log("Tokens:", tokens); // Ajout d'un log pour afficher les tokens récupérés

    // Send message to each token
    const responses = await Promise.all(
      tokens.map(token => {
        return getMessaging().sendToDevice(token, message);
      })
    );

    console.log("Responses:", responses); // Ajout d'un log pour afficher les réponses de l'envoi de message

    // Handle responses
    responses.forEach((response, index) => {
      if (response.failureCount > 0) {
        console.error("Error sending message to", tokens[index], ":", response.errors[0].error);
      } else {
        console.log("Successfully sent message to", tokens[index]);
      }
    });

    res.status(200).json({
      message: "Successfully sent message to all tokens",
      tokens: tokens
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});





app.listen(3000, function () {
  console.log("Server started on port 3000");
});
