import { useState } from 'react';
import { Languages } from 'lucide-react';
import './_group.css';

export function Current() {
  const [locale, setLocale] = useState<'ar' | 'fr'>('ar');

  return (
    <div className="bl-preview" dir="ltr">
      <header className="bl-header">
        <div className="bl-brand">
          <span className="bl-brand-mark"><Languages size={15} aria-hidden="true" /></span>
          BarberLink
        </div>
        <nav className="bl-nav" aria-label="Navigation principale">
          <span>Découvrir</span><span>Mes demandes</span>
        </nav>
        <div className="bl-current-control" role="group" aria-label="Changer de langue">
          <button type="button" onClick={() => setLocale('ar')} aria-pressed={locale === 'ar'}>العربية</button>
          <button type="button" onClick={() => setLocale('fr')} aria-pressed={locale === 'fr'}>Français</button>
        </div>
      </header>
      <div className="bl-preview-caption">
        <strong>BarberLink</strong>
        Le sélecteur actuel affiche les deux langues en permanence.
      </div>
    </div>
  );
}
