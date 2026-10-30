import { useEffect, useRef, useState } from 'react';
import { Check, Languages } from 'lucide-react';
import './_group.css';

export function HeaderDropdown() {
  const [locale, setLocale] = useState<'ar' | 'fr'>('ar');
  const [open, setOpen] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const choose = (nextLocale: 'ar' | 'fr') => {
    setLocale(nextLocale);
    setOpen(false);
  };

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
        <div className="bl-dropdown-wrap" ref={menuRef}>
          <button
            type="button"
            className="bl-trigger"
            aria-label="Changer de langue"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls="language-menu"
            onClick={() => setOpen((value) => !value)}
          >
            <Languages size={18} aria-hidden="true" />
          </button>
          {open && (
            <div className="bl-menu" id="language-menu" role="menu" aria-label="Choisir une langue">
              <button type="button" role="menuitemradio" aria-checked={locale === 'ar'} onClick={() => choose('ar')}>
                <span lang="ar">العربية</span>
                {locale === 'ar' && <Check className="bl-menu-check" size={14} aria-hidden="true" />}
              </button>
              <button type="button" role="menuitemradio" aria-checked={locale === 'fr'} onClick={() => choose('fr')}>
                <span lang="fr">Français</span>
                {locale === 'fr' && <Check className="bl-menu-check" size={14} aria-hidden="true" />}
              </button>
            </div>
          )}
        </div>
      </header>
      <div className="bl-preview-caption">
        <strong>{locale === 'ar' ? 'محدد اللغة' : 'Sélecteur de langue'}</strong>
        {locale === 'ar' ? 'أيقونة ثابتة في الشريط العلوي مع قائمة منسدلة.' : 'Icône fixe dans l’en-tête avec un menu déroulant.'}
      </div>
    </div>
  );
}
