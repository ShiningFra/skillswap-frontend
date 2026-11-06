/** Notifications sur l'appareil (Web Push) : tout le code qui touche au navigateur est ici. */
import { ApiError, MODE_REEL, obtenirCleVapid, enregistrerPush, retirerPush } from "@/lib/api";

export type EtatPush = "indisponible" | "ios-installer" | "refuse" | "inactif" | "actif";

function conversion(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const brut = atob(base64);
  const sortie = new Uint8Array(new ArrayBuffer(brut.length));
  for (let i = 0; i < brut.length; i++) sortie[i] = brut.charCodeAt(i);
  return sortie;
}

function supporte() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function surIphone() {
  return typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
}

async function abonnementActuel(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  return reg ? reg.pushManager.getSubscription() : null;
}

export async function etatPush(): Promise<EtatPush> {
  if (!MODE_REEL) return "indisponible";
  if (!supporte()) return surIphone() ? "ios-installer" : "indisponible";
  if ((await obtenirCleVapid()) === null) return "indisponible";
  if (Notification.permission === "denied") return "refuse";
  return (await abonnementActuel()) ? "actif" : "inactif";
}

export async function activerPush(): Promise<void> {
  const cle = await obtenirCleVapid();
  if (!supporte() || cle === null) throw new ApiError("errors.pushIndisponible");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new ApiError("errors.pushRefuse");
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const abo = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: conversion(cle) }));
  const json = abo.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new ApiError("errors.generique");
  await enregistrerPush({ endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } });
}

/** Retire l'appareil côté serveur puis côté navigateur ; sans erreur bloquante (utilisé aussi à la déconnexion). */
export async function desactiverPush(): Promise<void> {
  if (!supporte()) return;
  const abo = await abonnementActuel();
  if (!abo) return;
  await retirerPush(abo.endpoint).catch(() => undefined);
  await abo.unsubscribe().catch(() => undefined);
}
