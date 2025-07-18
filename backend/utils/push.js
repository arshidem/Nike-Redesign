// utils/push.js
const webPush = require("web-push");

webPush.setVapidDetails(
  "mailto:admin@example.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

function sendPushNotification(subscription, payload) {
  return webPush.sendNotification(subscription, JSON.stringify(payload));
}

module.exports = sendPushNotification;