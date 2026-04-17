# Multi-Language System - i18n Setup

Your Sacred Heart Parish system now supports **5 languages**:
- 🇺🇸 English
- 🇵🇭 Filipino
- 🇪🇸 Español (Spanish)
- 🇫🇷 Français (French)
- 🇩🇪 Deutsch (German)

## How to Use Translations in Components

### Basic Usage

```tsx
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <p>{t('common.email')}</p>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### Change Language Programmatically

```tsx
import { useTranslation } from 'react-i18next';

export function LanguageButton() {
  const { i18n } = useTranslation();

  return (
    <button onClick={() => i18n.changeLanguage('fil')}>
      Switch to Filipino
    </button>
  );
}
```

### With Dynamic Values

```tsx
const { t } = useTranslation();

// In translation.json: "greeting": "Hello, {{name}}"
<p>{t('greeting', { name: 'John' })}</p>
```

## File Structure

```
src/
├── i18n/
│   ├── config.ts                 (Main configuration)
│   ├── locales/
│   │   ├── en/
│   │   │   └── translation.json  (English strings)
│   │   ├── fil/
│   │   │   └── translation.json  (Filipino strings)
│   │   ├── es/
│   │   │   └── translation.json  (Spanish strings)
│   │   ├── fr/
│   │   │   └── translation.json  (French strings)
│   │   └── de/
│   │       └── translation.json  (German strings)
├── app/components/
│   └── LanguageSwitcher.tsx      (Language selector component)
```

## Adding the Language Switcher to Your App

Add the `LanguageSwitcher` component to your UserNavbar or AdminLayout:

```tsx
import { LanguageSwitcher } from './LanguageSwitcher';

export function UserNavbar() {
  return (
    <nav className="flex items-center justify-between">
      <h1>Sacred Heart Parish</h1>
      <LanguageSwitcher />
    </nav>
  );
}
```

## Adding New Languages

To add a new language (e.g., Italian):

1. Create folder: `src/i18n/locales/it/`
2. Copy `en/translation.json` to `it/translation.json` and translate all strings
3. Update `src/i18n/config.ts`:

```tsx
import itTranslation from './locales/it/translation.json';

const resources = {
  // ... existing languages
  it: { translation: itTranslation },
};
```

4. Update `LanguageSwitcher.tsx`:

```tsx
const languages = [
  // ... existing languages
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
];
```

## Translation Key Structure

All translations are organized by category:
- `common.*` - General words (home, about, contact, etc.)
- `auth.*` - Authentication (login, register, etc.)
- `dashboard.*` - Dashboard content
- `services.*` - Service-related terms
- `announcements.*` - Announcements page
- `messages.*` - Messages/inbox
- `admin.*` - Admin panel terms

## Features

✅ **Auto-detection** - Uses browser language if available  
✅ **Persistence** - Saves language choice to localStorage  
✅ **Easy switching** - Language switcher component included  
✅ **Fallback** - Defaults to English if translation missing  
✅ **Type-safe** - Full TypeScript support  
✅ **Performance** - Lazy loading of translations  

## Example: Converting a Page to Use i18n

**Before:**
```tsx
<h1>Welcome to Sacred Heart Parish</h1>
<p>Our Services</p>
<button>Book Now</button>
```

**After:**
```tsx
import { useTranslation } from 'react-i18next';

export function Services() {
  const { t } = useTranslation();

  return (
    <>
      <h1>{t('common.welcome')}</h1>
      <p>{t('services.allServices')}</p>
      <button>{t('services.bookService')}</button>
    </>
  );
}
```

---

**The language preference is automatically saved to localStorage and will persist across browser sessions!**
