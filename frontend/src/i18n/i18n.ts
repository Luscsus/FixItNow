import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import sl from "./locales/sl.json";

const STORAGE_KEY = "fixitnow.language";

const savedLang = typeof window !== "undefined"
  ? (localStorage.getItem(STORAGE_KEY) ?? "en")
  : "en";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      sl: { translation: sl },
    },
    lng: savedLang,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

export function setLanguage(lang: "en" | "sl") {
  i18n.changeLanguage(lang);
  localStorage.setItem(STORAGE_KEY, lang);
}

export default i18n;
