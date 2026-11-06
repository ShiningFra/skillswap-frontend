/* Service worker de SkillSwap : uniquement les notifications sur l'appareil. Aucun cache, aucune interception du réseau. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch {
    d = {};
  }
  // Les fenêtres ouvertes rafraîchissent leurs données sans attendre.
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((fenetres) => fenetres.forEach((f) => f.postMessage({ type: "push" }))),
  );
  event.waitUntil(
    self.registration.showNotification(typeof d.titre === "string" ? d.titre : "SkillSwap", {
      body: typeof d.corps === "string" ? d.corps : "Tu as une nouvelle notification",
      tag: typeof d.tag === "string" ? d.tag : undefined,
      data: { lien: typeof d.lien === "string" ? d.lien : "/notifications" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const brut = event.notification.data && event.notification.data.lien;
  // Seul un chemin interne est suivi, jamais une adresse externe.
  const lien = typeof brut === "string" && /^\/[a-z0-9/_-]*$/.test(brut) ? brut : "/notifications";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (fenetres) => {
      for (const f of fenetres) {
        if (new URL(f.url).origin === self.location.origin) {
          await f.focus();
          if ("navigate" in f) await f.navigate(lien);
          return;
        }
      }
      await self.clients.openWindow(lien);
    }),
  );
});
