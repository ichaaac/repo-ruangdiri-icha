import { useState, useEffect } from "react";
import Pushy from "pushy-sdk-web";

export const usePushyPermission = (userId) => {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied",
  );

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!userId) return;

    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== "granted") return;

    try {
      const token = await Pushy.register({
        serviceWorkerFile: "service-worker.js",
      });
      console.log("Pushy Device Token:", token);
      await Pushy.subscribe(`user-${userId}`);
    } catch (err) {
      console.error("Pushy register error:", err);
    }
  };

  const shouldShowBanner = permission === "default";

  return { permission, requestPermission, shouldShowBanner };
};
