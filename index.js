import {initializeApp, applicationDefault } from 'firebase-admin/app';
import { getMessaging } from "firebase-admin/messaging";
import express, { json } from "express";
import cors from "cors";
import admin from "firebase-admin";
import serviceAccount from "./serverkey.json" assert { type: "json" };
import cron from 'node-cron';
import fs from 'fs';


async function sendNotifications() {
  try {
    // Récupérer les tokens depuis Firestore
    const snapshot = await db.collection("tokens").get();
    const tokens = [];
    snapshot.forEach((doc) => {
      tokens.push(doc.data().token);
    });

    // Lire le contenu du fichier JSON contenant les douaas
    const data = fs.readFileSync('./notifications.json', 'utf8');
    const douaas = JSON.parse(data);

    const today = new Date().toLocaleString('en-US', { weekday: 'long' }); // Récupérer le jour actuel

    // Vérifier si le jour actuel a un douaa correspondant dans le fichier JSON des douaas
    if (douaas.hasOwnProperty(today)) {
      const douaa = douaas[today]; // Récupérer le douaa pour le jour actuel

      // Construire le message avec les tokens et le douaa pour le jour actuel
      const message = {
        notification: {
          title: "دعاء اليوم",
          body: douaa
        },
        tokens: tokens
      };

      // Envoyer le message
      const response = await admin.messaging().sendMulticast(message);
      console.log("Successfully sent message:", response);
    } else {
      console.error("No douaa found for today");
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
}



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


app.post("/send", function (req, res) {
  const receivedToken = req.body.fcmToken;
  let tokens; // Déplacez la définition de la variable tokens ici
  
  // Lire le contenu du fichier JSON contenant les douaas
  fs.readFile('./notifications.json', 'utf8', (err, data) => {
      if (err) {
          console.error("Error reading douaas file:", err);
          res.status(500).json({ error: "Internal server error" });
          return;
      }
      
      const douaas = JSON.parse(data); // Convertir le contenu JSON en objet JavaScript
      
      const today = new Date().toLocaleString('en-US', { weekday: 'long' }); // Récupérer le jour actuel
      
      // Vérifier si le jour actuel est dans le fichier JSON des douaas
      if (douaas.hasOwnProperty(today)) {
          const douaa = douaas[today]; // Récupérer le douaa pour le jour actuel
          
          // Get tokens from Firestore
          db.collection("tokens").get()
            .then((snapshot) => {
              tokens = []; // Réinitialisez tokens ici pour éviter les problèmes de portée
              snapshot.forEach((doc) => {
                tokens.push(doc.data().token);
              });

              // Construct message with tokens and douaa
              const message = {
                notification: {
                  title: "دعاء اليوم",
                  body: douaa // Utilisez le douaa pour le jour actuel
                },
                tokens: tokens, // Use tokens retrieved from Firestore
              };

              // Send message
              return admin.messaging().sendMulticast(message);
            })
            .then((response) => {
              res.status(200).json({
                message: "Successfully sent message",
                tokens: tokens, // Utilisez la variable tokens ici
              });
              console.log("Successfully sent message:", response);
            })
            .catch((error) => {
              res.status(400).send(error);
              console.error("Error sending message:", error);
            });
      } else {
          console.error("No douaa found for today");
          res.status(404).json({ error: "Douaa not found for today" });
      }
  });
});


cron.schedule('45 1 * * *', () => {
  sendNotifications();
}, { timezone: 'Africa/Tunis' });



app.listen(3001, function () {
  console.log("Server started on port 3000");
});
