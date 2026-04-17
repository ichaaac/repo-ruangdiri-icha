import { useState, useEffect } from "react";
import { notificationsAPI } from "@/components/shared/notifications/lib/api";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function registerSubscription() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  await notificationsAPI.savePushSubscription(subscription.toJSON());
}

export const useWebPushNotification = () => {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied",
  );

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    if (!VAPID_PUBLIC_KEY) return;

    setPermission("granted");

    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((existing) => {
        if (!existing) {
          registerSubscription().catch(() => {});
          return;
        }

        const existingKey = existing.options?.applicationServerKey;
        const expectedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        const isSameKey =
          existingKey &&
          existingKey.byteLength === expectedKey.byteLength &&
          new Uint8Array(existingKey).every((v, i) => v === expectedKey[i]);

        if (isSameKey) {
          notificationsAPI
            .savePushSubscription(existing.toJSON())
            .catch(() => {});
        } else {
          existing
            .unsubscribe()
            .then(() => {
              registerSubscription().catch(() => {});
            })
            .catch(() => {});
        }
      });
    });
  }, []);

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== "granted") return;

    try {
      await registerSubscription();
    } catch (err) {
      console.error("Push subscription error:", err);
    }
  };

  const isPushSupported =
    typeof Notification !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  const shouldShowBanner = isPushSupported && permission === "default";

  return { permission, requestPermission, shouldShowBanner };
};
