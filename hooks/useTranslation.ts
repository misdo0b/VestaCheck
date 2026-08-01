import { usePreferencesStore } from '@/store/usePreferencesStore';
import { dictionaries, LanguageCode } from '@/lib/i18n/dictionaries';

export function useTranslation() {
  const language = usePreferencesStore((state) => state.preferences.language) || 'fr';
  
  const t = (key: string): string => {
    const keys = key.split('.');
    let translation: any = dictionaries[language as LanguageCode] || dictionaries['fr'];
    
    for (const k of keys) {
      if (translation && translation[k] !== undefined) {
        translation = translation[k];
      } else {
        // Fallback to French
        let fallback: any = dictionaries['fr'];
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) {
            fallback = fallback[fk];
          } else {
            return key; // Return the path as a fallback if not found anywhere
          }
        }
        return fallback;
      }
    }
    
    return typeof translation === 'string' ? translation : key;
  };
  
  return { t, language: language as LanguageCode };
}
