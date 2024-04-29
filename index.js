import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import express from 'express';
import cors from 'cors';

// Importing environment variable
import dotenv from 'dotenv';
dotenv.config();

// Assigning environment variable to a constant
const serviceAccountKey = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Initialize Express app
const app = express();
app.use(express.json());

// Enable CORS
app.use(cors());

// Set Content-Type header for all responses
app.use(function(req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Initialize Firebase app
initializeApp({
  credential: applicationDefault(),
  projectId: 'potion-for-creators',
});

// Define POST route to send notification
app.post('/send', function(req, res) {
  const receivedToken = req.body.fcmToken;

  const message = {
    notification: {
      title: 'Notif',
      body: 'This is a Test Notification',
    },
    token: receivedToken,
  };

  getMessaging()
    .send(message)
    .then((response) => {
      res.status(200).json({
        message: 'Successfully sent message',
        token: receivedToken,
      });
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      res.status(400).json({
        error: 'Error sending message',
        details: error,
      });
      console.log('Error sending message:', error);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log(`Server started on port ${PORT}`);
});
