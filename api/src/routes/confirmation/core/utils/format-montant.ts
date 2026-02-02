/**
 * Utilitaire pour formater les montants
 */

/**
 * Formate un montant en devise
 * @param montant - Le montant à formater
 * @param currency - La devise (par défaut: 'EUR')
 * @param locale - La locale (par défaut: 'fr-FR')
 * @returns Le montant formaté
 */
export function formatMontant(
  montant: number,
  currency: string = "EUR",
  locale: string = "fr-FR"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(montant);
  } catch (e) {
    console.warn("⚠️ [FormatMontant] Erreur formatage:", e);
    return `${montant} ${currency === "EUR" ? "€" : currency}`;
  }
}
