import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fil', name: 'Filipino', flag: '🇵🇭' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) ||
    languages.find(lang => lang.code === 'en');

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative z-50">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/30 hover:bg-white/10 transition-colors text-white"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">{currentLanguage?.name}</span>
        <span className="text-lg sm:hidden">{currentLanguage?.flag}</span>
      </motion.button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50"
        >
          <div className="p-2">
            {languages.map(lang => (
              <motion.button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  i18n.language === lang.code
                    ? 'bg-primary text-white'
                    : 'hover:bg-secondary'
                }`}
                whileHover={{ x: 4 }}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="text-sm font-medium">{lang.name}</span>
                {i18n.language === lang.code && (
                  <span className="ml-auto">✓</span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
