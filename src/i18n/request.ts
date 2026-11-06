import { getRequestConfig } from "next-intl/server";

/**
 * Langue unique au lancement (le CDC exclut le multilingue). Pour ajouter l'anglais :
 * créer messages/en.json et choisir la langue ici (cookie ou préfixe d'URL).
 */
export default getRequestConfig(async () => {
  const locale = "fr";
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
