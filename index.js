import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getMessaging } from "firebase-admin/messaging";
import express, { json } from "express";
import cors from "cors";
import admin from "firebase-admin";
import serviceAccount from "./serverkey.json" assert { type: "json" };
import schedule from 'node-schedule';

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

const douaData = {
  "Monday": "Doua pour le lundi",
  "Tuesday": "Doua pour le mardi",
  "Wednesday": "Doua pour le mercredi",
  "Thursday": "Doua pour le jeudi",
  "Friday": "Doua pour le vendredi",
  "Saturday": "Doua pour le samedi",
  "Sunday": "Doua pour le dimanche"
};

// Fonction pour envoyer le doua quotidien
const sendDailyDoua = () => {
  const today = new Date();
  const day = today.toLocaleString('en', { weekday: 'long' });
  const message = {
    notification: {
      title: "Doua du jour",
      body: douaData[day],
    },
    // Remplacez le token par celui de votre destinataire
    token: "e76EReYaSySl-8KGAdOC6I:APA91bH34YuuwsNnMsOuzHtu-HSGlnPMD3diiTpaXX1Shvlq-BIRKN20DUrSbhl7g8iGErQPiXxEjGuQ7G99F4JzkI1ZtfkQjJ1G2HQVTB2fla4QqtRrr0v4kJD6igD8WqI3YkIlqeWK",
  };

  getMessaging().send(message)
    .then((response) => {
      console.log("Successfully sent daily doua:", response);
    })
    .catch((error) => {
      console.error("Error sending daily doua:", error);
    });
};

// Planifier l'envoi quotidien du doua à 23h du soir
schedule.scheduleJob('0 23 * * *', () => {
  sendDailyDoua();
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
