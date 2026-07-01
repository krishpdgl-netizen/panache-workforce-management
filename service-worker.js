// Panache WMS — minimal service worker.
// Its only job is to make the app installable and cache the app "shell"
// (HTML/CSS/JS/icons) so the last-loaded screen still opens if you're offline.
// It deliberately does NOT cache API responses — those always come fresh
// from the network so your data is never stale.

const CACHE_NAME = "panache-wms-shell-v2";

const SHELL_FILES = [
  "index.html",
  "register.html",
  "manager-dashboard.html",
  "employee-dashboard.html",
  "admin-dashboard.html",
  "attendance.html",
  "create-task.html",
  "team-members.html",
  "reports.html",
  "settings.html",
  "sales-dashboard.html",
  "history.html",
  "calendar.html",
  "employee-hub.html",
  "letterhead.html",
  "reminder.html",
  "admin-export.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Cache what we can; don't fail install if one file is missing/renamed.
      Promise.all(
        SHELL_FILES.map((url) => cache.add(url).catch(() => {}))
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Never cache API calls to the backend — always go to network.
  if (req.url.includes("backend-production-53f3.up.railway.app")) {
    return;
  }

  // Only handle GET requests for our own origin's static files.
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          // Keep the shell cache fresh with the latest version of each file.
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached); // offline: fall back to cache

      // Serve cached instantly if we have it, update in background.
      return cached || network;
    })
  );
});
