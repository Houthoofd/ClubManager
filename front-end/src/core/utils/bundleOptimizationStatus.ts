/**
 * ====================================================================
 * BUNDLE OPTIMIZATION STATUS CHECKER
 * ====================================================================
 *
 * Affiche l'état d'optimisation du bundle dans la console au démarrage.
 * Indique si le bundle est optimisé et donne les prochaines étapes.
 */

import { isDev } from "@/core/config/env";

interface OptimizationCheck {
  name: string;
  implemented: boolean;
  impact: string;
  description: string;
}

const OPTIMIZATIONS: OptimizationCheck[] = [
  {
    name: "Code Splitting (Routes)",
    implemented: false, // À vérifier manuellement
    impact: "⭐⭐⭐ HAUTE (-40% bundle initial)",
    description: "Lazy loading des routes avec React.lazy()",
  },
  {
    name: "Dynamic Imports (Heavy Components)",
    implemented: false,
    impact: "⭐⭐ MOYENNE (-20% bundle)",
    description: "Recharts, Stripe chargés à la demande",
  },
  {
    name: "Bundle Analyzer",
    implemented: false,
    impact: "⭐ ANALYSE",
    description: "rollup-plugin-visualizer installé",
  },
  {
    name: "Unused Dependencies Removal",
    implemented: false,
    impact: "⭐⭐ MOYENNE (-10-15KB)",
    description: "depcheck exécuté et deps supprimées",
  },
  {
    name: "Brotli Compression",
    implemented: false,
    impact: "⭐ BASSE (-10-15% vs gzip)",
    description: "vite-plugin-compression configuré",
  },
];

export function displayBundleOptimizationStatus(): void {
  if (!isDev) return; // Uniquement en développement

  const implementedCount = OPTIMIZATIONS.filter((opt) => opt.implemented).length;
  const totalCount = OPTIMIZATIONS.length;
  const percentage = Math.round((implementedCount / totalCount) * 100);

  console.log("\n");
  console.log(
    "%c╔════════════════════════════════════════════════════════════════╗",
    "color: #00d4ff; font-weight: bold;",
  );
  console.log(
    "%c║         📦 BUNDLE OPTIMIZATION STATUS                          ║",
    "color: #00d4ff; font-weight: bold;",
  );
  console.log(
    "%c╚════════════════════════════════════════════════════════════════╝",
    "color: #00d4ff; font-weight: bold;",
  );
  console.log("\n");

  // Statut global
  if (percentage === 0) {
    console.log(
      "%c⚠️  BUNDLE NON OPTIMISÉ",
      "font-size: 16px; font-weight: bold; color: #ff6b6b; background: #2d2d2d; padding: 8px 16px; border-radius: 4px;",
    );
    console.log("\n");
    console.log(
      "%cℹ️  Le bundle est actuellement en configuration par défaut.",
      "color: #ffd93d; font-size: 13px;",
    );
    console.log(
      "%c   Taille estimée: ~888KB (gzip) | ~2.5-3MB (non-gzip)",
      "color: #ff6b6b; font-size: 12px;",
    );
  } else if (percentage < 50) {
    console.log(
      `%c⚡ PARTIELLEMENT OPTIMISÉ (${percentage}%)`,
      "font-size: 16px; font-weight: bold; color: #ffd93d; background: #2d2d2d; padding: 8px 16px; border-radius: 4px;",
    );
  } else {
    console.log(
      `%c✅ OPTIMISÉ (${percentage}%)`,
      "font-size: 16px; font-weight: bold; color: #00ff88; background: #2d2d2d; padding: 8px 16px; border-radius: 4px;",
    );
  }

  console.log("\n");

  // Détails des optimisations
  console.log(
    "%c📊 DÉTAILS DES OPTIMISATIONS:",
    "color: #00d4ff; font-weight: bold; font-size: 14px;",
  );
  console.log("\n");

  OPTIMIZATIONS.forEach((opt, index) => {
    const status = opt.implemented ? "✅" : "❌";
    const color = opt.implemented ? "#00ff88" : "#ff6b6b";

    console.log(
      `%c${status} ${index + 1}. ${opt.name}`,
      `color: ${color}; font-weight: bold; font-size: 13px;`,
    );
    console.log(`   Impact: ${opt.impact}`);
    console.log(`   ${opt.description}`);
    console.log("");
  });

  // Prochaines étapes si non optimisé
  if (percentage < 100) {
    console.log("\n");
    console.log(
      "%c🚀 PROCHAINES ÉTAPES RECOMMANDÉES:",
      "color: #00d4ff; font-weight: bold; font-size: 14px; text-decoration: underline;",
    );
    console.log("\n");

    if (!OPTIMIZATIONS[2].implemented) {
      console.log(
        "%c📍 ÉTAPE 1: Installer l'analyseur de bundle",
        "color: #ffd93d; font-weight: bold;",
      );
      console.log(
        "%c   Cela vous permettra de visualiser exactement ce qui prend de la place.",
        "color: #a8dadc;",
      );
      console.log("");
      console.log("%c   Commandes:", "color: #00ff88; font-weight: bold;");
      console.log("   npm install -D rollup-plugin-visualizer");
      console.log("");
      console.log("%c   Puis ajouter dans vite.config.ts:", "color: #00ff88; font-weight: bold;");
      console.log("   import { visualizer } from 'rollup-plugin-visualizer';");
      console.log("   // Dans plugins: [");
      console.log(
        "   //   visualizer({ filename: './dist/stats.html', open: true, gzipSize: true })",
      );
      console.log("   // ]");
      console.log("");
      console.log("%c   Ensuite:", "color: #00ff88; font-weight: bold;");
      console.log("   npm run build");
      console.log("   // → Ouvre automatiquement stats.html avec visualisation interactive");
      console.log("\n");
    }

    if (!OPTIMIZATIONS[0].implemented) {
      console.log(
        "%c📍 ÉTAPE 2: Implémenter le Code Splitting (PRIORITÉ HAUTE)",
        "color: #ffd93d; font-weight: bold;",
      );
      console.log(
        "%c   ⭐ PLUS GROS IMPACT: -40% sur le bundle initial !",
        "color: #ff6b6b; font-weight: bold;",
      );
      console.log("");
      console.log(
        "%c   Lazy load des routes dans src/app/routes/index.tsx:",
        "color: #00ff88; font-weight: bold;",
      );
      console.log("");
      console.log("   import { lazy, Suspense } from 'react';");
      console.log("");
      console.log("   // AVANT (tout chargé au démarrage):");
      console.log("   import { ShopPage } from '@/features/shop';");
      console.log("");
      console.log("   // APRÈS (chargé à la demande):");
      console.log("   const ShopPage = lazy(() => import('@/features/shop/pages/ShopPage'));");
      console.log("   const StatsPage = lazy(() => import('@/features/stats/pages/StatsPage'));");
      console.log("   // ... autres routes");
      console.log("");
      console.log("   // Wrapper avec Suspense:");
      console.log("   element: (");
      console.log("     <Suspense fallback={<PageSpinner />}>");
      console.log("       <ShopPage />");
      console.log("     </Suspense>");
      console.log("   ),");
      console.log("");
      console.log("%c   Routes à lazy-load:", "color: #00ff88; font-weight: bold;");
      console.log("   • Shop (e-commerce)");
      console.log("   • Stats (+ recharts = 120KB !) ⭐ IMPORTANT");
      console.log("   • Courses");
      console.log("   • Orders");
      console.log("   • Messages");
      console.log("   • Teachers");
      console.log("   • Users");
      console.log("\n");
    }

    if (!OPTIMIZATIONS[3].implemented) {
      console.log(
        "%c📍 ÉTAPE 3: Supprimer dépendances inutilisées",
        "color: #ffd93d; font-weight: bold;",
      );
      console.log("");
      console.log("%c   Commandes:", "color: #00ff88; font-weight: bold;");
      console.log("   npm install -D depcheck");
      console.log("   npx depcheck");
      console.log("");
      console.log('   // Supprime les dépendances listées comme "unused"');
      console.log("   npm uninstall <package-name>");
      console.log("\n");
    }

    if (!OPTIMIZATIONS[1].implemented) {
      console.log(
        "%c📍 ÉTAPE 4: Dynamic Imports (composants lourds)",
        "color: #ffd93d; font-weight: bold;",
      );
      console.log("");
      console.log(
        "%c   Lazy load Recharts (120KB) uniquement sur page Stats:",
        "color: #00ff88; font-weight: bold;",
      );
      console.log("   const BarChart = lazy(() =>");
      console.log("     import('recharts').then(mod => ({ default: mod.BarChart }))");
      console.log("   );");
      console.log("");
      console.log(
        "%c   Lazy load Stripe uniquement au checkout:",
        "color: #00ff88; font-weight: bold;",
      );
      console.log(
        "   const StripeForm = lazy(() => import('@/features/shop/components/StripeForm'));",
      );
      console.log("\n");
    }

    if (!OPTIMIZATIONS[4].implemented) {
      console.log(
        "%c📍 ÉTAPE 5: Activer Brotli Compression (optionnel)",
        "color: #ffd93d; font-weight: bold;",
      );
      console.log("");
      console.log("%c   Commandes:", "color: #00ff88; font-weight: bold;");
      console.log("   npm install -D vite-plugin-compression");
      console.log("");
      console.log("   // Dans vite.config.ts:");
      console.log("   import viteCompression from 'vite-plugin-compression';");
      console.log("   // plugins: [viteCompression({ algorithm: 'brotliCompress' })]");
      console.log("\n");
    }

    // Résumé des gains attendus
    console.log("\n");
    console.log(
      "%c💰 GAINS ATTENDUS (avec toutes optimisations):",
      "color: #00d4ff; font-weight: bold; font-size: 14px;",
    );
    console.log("");
    console.log(
      "%c   Initial Bundle:  888KB → ~350KB (gzip)  ⬇️ -60%",
      "color: #00ff88; font-size: 13px;",
    );
    console.log(
      "%c   Total Bundle:    ~3MB → ~1.5MB          ⬇️ -50%",
      "color: #00ff88; font-size: 13px;",
    );
    console.log(
      "%c   TTI (Time to Interactive): 3.5s → ~1.5s  ⬇️ -55%",
      "color: #00ff88; font-size: 13px;",
    );
    console.log("");
  } else {
    console.log("\n");
    console.log("%c🎉 FÉLICITATIONS !", "color: #00ff88; font-weight: bold; font-size: 16px;");
    console.log(
      "%c   Toutes les optimisations sont implémentées !",
      "color: #00ff88; font-size: 13px;",
    );
    console.log("\n");
  }

  // Note importante
  console.log("\n");
  console.log(
    "%cℹ️  NOTE: Consultez vite.config.bundle-notes.ts pour plus de détails",
    "color: #a8dadc; font-style: italic;",
  );
  console.log("\n");
  console.log(
    "%c════════════════════════════════════════════════════════════════",
    "color: #00d4ff;",
  );
  console.log("\n");
}
