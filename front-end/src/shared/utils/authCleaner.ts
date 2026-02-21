import React from "react";
import { apiUrl } from "./apiUrl";

/**
 * NOUVEAU: Nettoyer les cookies côté serveur via API
 */
export const clearServerCookies = async (): Promise<boolean> => {
  try {
    console.log("🌐 Nettoyage des cookies côté serveur...");

    const token = localStorage.getItem("authToken");

    // Essayer d'abord la route authentifiée
    if (token) {
      try {
        const response = await fetch(`${apiUrl("/auth/logout")}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include", // Important pour envoyer les cookies
        });

        if (response.ok) {
          console.log("✅ Cookies serveur supprimés avec authentification");
          return true;
        }
      } catch (authError) {
        console.log(
          "⚠️ Échec route authentifiée, tentative route de secours...",
        );
      }
    }

    // Route de secours sans authentification
    const fallbackResponse = await fetch(`${apiUrl("/auth/cleanup-cookies")}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (fallbackResponse.ok) {
      console.log("✅ Cookies serveur supprimés via route de secours");
      return true;
    } else {
      console.log("❌ Échec suppression cookies serveur");
      return false;
    }
  } catch (error) {
    console.error(
      "❌ Erreur lors de la suppression des cookies serveur:",
      error,
    );
    return false;
  }
};

/**
 * Utilitaire pour nettoyer complètement toutes les données d'authentification
 */
export const clearAllAuthData = async (): Promise<void> => {
  console.log(
    "🧹 [AuthCleaner] Début du nettoyage complet des données d'authentification...",
  );

  // NOUVEAU: 1. Appeler la route de déconnexion côté serveur AVANT de nettoyer côté client
  try {
    console.log("🚪 [AuthCleaner] Appel de la route de déconnexion serveur...");

    const token =
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      getCookie("token");

    if (token) {
      const apiUrl =
        process.env.NODE_ENV === "production"
          ? `${window.location.origin}/auth/logout`
          : "http://localhost:3000/auth/logout";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include", // IMPORTANT: pour envoyer les cookies
      });

      if (response.ok) {
        const data = await response.json();
        console.log(
          "✅ [AuthCleaner] Déconnexion serveur réussie:",
          data.message,
        );
        console.log(
          "🗑️ [AuthCleaner] Cookies supprimés côté serveur:",
          data.cookiesCleared,
        );
      } else {
        console.warn(
          "⚠️ [AuthCleaner] Échec déconnexion serveur (continuons le nettoyage client):",
          response.status,
        );
      }
    } else {
      console.log(
        "ℹ️ [AuthCleaner] Pas de token trouvé, pas d'appel serveur nécessaire",
      );
    }
  } catch (serverError) {
    console.error(
      "❌ [AuthCleaner] Erreur lors de l'appel serveur (continuons le nettoyage client):",
      serverError,
    );
  }

  // 2. Nettoyer localStorage
  const keysToRemove = [
    "userData",
    "authToken",
    "token",
    "user",
    "auth_user",
    "currentUser",
    "userInfo",
    "session",
    "sessionData",
    "accessToken",
    "refreshToken",
    "jwt",
    "auth_data",
    "loginData",
    "userProfile",
  ];

  keysToRemove.forEach((key) => {
    try {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🗑️ [AuthCleaner] localStorage "${key}" supprimé`);
      }
    } catch (error) {
      console.warn(
        `⚠️ [AuthCleaner] Erreur suppression localStorage "${key}":`,
        error,
      );
    }
  });

  // 3. Nettoyer sessionStorage
  try {
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach((key) => {
      if (
        authCookiePatterns.some((pattern: string) =>
          key.toLowerCase().includes(pattern.toLowerCase()),
        )
      ) {
        sessionStorage.removeItem(key);
        console.log(`🗑️ [AuthCleaner] sessionStorage "${key}" supprimé`);
      }
    });
  } catch (error) {
    console.warn("⚠️ [AuthCleaner] Erreur nettoyage sessionStorage:", error);
  }

  // 4. Nettoyer les cookies côté client
  console.log("🍪 [AuthCleaner] Nettoyage des cookies côté client...");

  const cookiesToClear = [
    "token",
    "authToken",
    "userData",
    "user",
    "auth_token",
    "access_token",
    "refresh_token",
    "sessionId",
    "session",
    "jwt",
    "JWT",
    "auth_data",
    "loginData",
  ];

  cookiesToClear.forEach((cookieName) => {
    try {
      const cookieVariants = [
        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`,
        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`,
        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`,
        `${cookieName}=; max-age=0; path=/`,
        `${cookieName}=; max-age=0; path=/; domain=${window.location.hostname}`,
        `${cookieName}=deleted; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`,
      ];

      cookieVariants.forEach((cookieString) => {
        try {
          document.cookie = cookieString;
        } catch (e) {
          // Ignorer les erreurs de suppression de cookies
        }
      });

      console.log(
        `🍪 [AuthCleaner] Cookie "${cookieName}" nettoyé côté client`,
      );
    } catch (error) {
      console.warn(
        `⚠️ [AuthCleaner] Échec nettoyage cookie "${cookieName}":`,
        error,
      );
    }
  });

  // 5. Nettoyer les cookies côté serveur
  await clearServerCookies();

  // 6. Vérification finale et log des cookies restants
  const remainingCookies = document.cookie
    .split(";")
    .filter((c) => c.trim().length > 0);
  if (remainingCookies.length > 0) {
    console.log(
      "⚠️ [AuthCleaner] Cookies restants après nettoyage:",
      remainingCookies,
    );

    // Dernière tentative agressive pour les cookies persistants
    remainingCookies.forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      if (
        authCookiePatterns.some((pattern: string) =>
          name.toLowerCase().includes(pattern.toLowerCase()),
        )
      ) {
        console.log(
          `🚨 [AuthCleaner] Cookie persistant détecté: "${name}" - Suppression forcée`,
        );

        // Suppression ultra-agressive
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=; SameSite=None; Secure=false`;
        document.cookie = `${name}=; max-age=0; path=/; domain=`;
        document.cookie = `${name}=deleted; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });
  } else {
    console.log("✅ [AuthCleaner] Tous les cookies supprimés avec succès");
  }

  // 7. Nettoyer IndexedDB (optionnel mais recommandé)
  try {
    if ("indexedDB" in window) {
      console.log("🗄️ [AuthCleaner] Nettoyage IndexedDB...");

      // Supprimer les bases de données liées à l'auth
      const authDatabases = ["auth", "user", "session", "token"];

      for (const dbName of authDatabases) {
        try {
          const deleteReq = indexedDB.deleteDatabase(dbName);
          deleteReq.onsuccess = () =>
            console.log(`🗑️ [AuthCleaner] IndexedDB "${dbName}" supprimée`);
        } catch (dbError) {
          console.warn(
            `⚠️ [AuthCleaner] Erreur suppression IndexedDB "${dbName}":`,
            dbError,
          );
        }
      }
    }
  } catch (indexedError) {
    console.warn("⚠️ [AuthCleaner] Erreur nettoyage IndexedDB:", indexedError);
  }

  // 8. Forcer le rafraîchissement de l'état d'authentification
  try {
    window.dispatchEvent(new Event("auth-cleared"));
    window.dispatchEvent(new Event("storage"));
  } catch (eventError) {
    console.warn("⚠️ [AuthCleaner] Erreur dispatch événements:", eventError);
  }

  console.log(
    "✅ [AuthCleaner] Nettoyage complet terminé (client + serveur + IndexedDB)",
  );
};

/**
 * Hook pour nettoyer l'authentification au montage d'un composant
 */
export const useClearAuthOnMount = () => {
  React.useEffect(() => {
    clearAllAuthData();
  }, []);
};

/**
 * Vérifier si un utilisateur est authentifié
 */
export const isUserAuthenticated = (): boolean => {
  const token = localStorage.getItem("authToken");
  const userData = localStorage.getItem("userData");
  const userRole = localStorage.getItem("userRole");

  if (!token || !userData) {
    return false;
  }

  try {
    const userDataParsed = JSON.parse(userData);
    return !!(
      userDataParsed.id &&
      userDataParsed.email &&
      (userDataParsed.status_id || userRole)
    );
  } catch {
    return false;
  }
};

/**
 * Fonction de diagnostic pour déboguer les cookies
 */
export const debugCookies = () => {
  console.log("🔍 [AuthCleaner] DIAGNOSTIC COOKIES:");
  console.log("📋 [AuthCleaner] Tous les cookies actuels:");

  if (document.cookie.length === 0) {
    console.log("   ✅ [AuthCleaner] Aucun cookie présent");
    return;
  }

  document.cookie.split(";").forEach((cookie, index) => {
    const [name, value] = cookie.split("=").map((s) => s.trim());
    const isAuth = authCookiePatterns.some((pattern: string) =>
      name.toLowerCase().includes(pattern.toLowerCase()),
    );

    console.log(
      `   ${index + 1}. ${isAuth ? "🔐" : "📄"} "${name}" = "${value?.substring(0, 20)}${value?.length > 20 ? "..." : ""}"`,
    );
  });

  console.log("🌐 [AuthCleaner] Domaine actuel:", window.location.hostname);
  console.log("📁 [AuthCleaner] Chemin actuel:", window.location.pathname);

  // Diagnostic localStorage
  console.log("💾 [AuthCleaner] localStorage auth-related:");
  Object.keys(localStorage).forEach((key, index) => {
    const isAuth = authCookiePatterns.some((pattern: string) =>
      key.toLowerCase().includes(pattern.toLowerCase()),
    );
    if (isAuth) {
      const value = localStorage.getItem(key);
      console.log(
        `   ${index + 1}. 🔐 "${key}" = "${value?.substring(0, 30)}${value && value.length > 30 ? "..." : ""}"`,
      );
    }
  });
};

// AJOUTÉ: Fonction helper pour lire un cookie (corrigée et typée)
const getCookie = (name: string): string | null => {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(";").shift();
      return cookieValue || null;
    }
    return null;
  } catch (error) {
    console.warn(`⚠️ [AuthCleaner] Erreur lecture cookie "${name}":`, error);
    return null;
  }
};

// AJOUTÉ: Définir les patterns de cookies d'authentification
const authCookiePatterns: string[] = [
  "auth",
  "token",
  "user",
  "session",
  "jwt",
  "login",
  "access",
  "refresh",
  "bearer",
];

// AJOUTÉ: Export de la fonction pour usage externe
export { getCookie, authCookiePatterns };
