import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  useCreateBarber,
  useCreateBooking,
  useUpdateBarberAvailability,
  useDecideBarberBooking,
  useGetBarber,
  useGetBarberSession,
  useGetBookingStatus,
  useGetAdminSession,
  useListBarbers,
  useListBarberBookings,
  useListPendingBarbers,
  useListPaymentCountries,
  useListAdminPaymentCountries,
  useUpdateAdminPaymentCountry,
  useLoginAdmin,
  useLoginBarber,
  useLoginBarberByEmail,
  useRecoverBarberPassword,
  useIssueBarberAccessCode,
  useLogoutAdmin,
  useLogoutBarber,
  useModerateBarber,
  useHealthCheck,
  getGetBarberQueryKey,
  getGetBarberSessionQueryKey,
  getGetBookingStatusQueryKey,
  getGetAdminSessionQueryKey,
  getListBarbersQueryKey,
  getListBarberBookingsQueryKey,
  getListPendingBarbersQueryKey,
  getListPaymentCountriesQueryKey,
  getListAdminPaymentCountriesQueryKey,
  type Barber,
  type BarberReview,
  type BarberInput,
  type BookingInput,
  type BookingTracking,
  type BarberBooking,
  type PaymentCountry,
} from '@workspace/api-client-react';
import { setBaseUrl } from '@workspace/api-client-react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  HeartHandshake,
  MapPin,
  Plus,
  Scissors,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  X,
  AlertCircle,
  RefreshCw,
  LockKeyhole,
  LogOut,
  Phone,
  UserRoundCheck,
  UserRoundX,
  CalendarClock,
  ChevronDown,
  Shield,
  Clipboard,
  CreditCard,
} from 'lucide-react';

setBaseUrl(import.meta.env.VITE_API_BASE_URL || null);
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { getLocale, LanguageControl, useLocale } from './locale';

const queryClient = new QueryClient();

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(getLocale() === 'ar' ? 'ar' : 'fr-FR', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency || ''} ${amount}`;
  }
}

function dateLabel(value: string | Date) {
  if (!value) return '';
  const dateValue = value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
  const date = new Date(`${dateValue}T12:00:00`);
  return new Intl.DateTimeFormat(getLocale() === 'ar' ? 'ar' : 'fr-FR', { dateStyle: 'long' }).format(date);
}

function Brand() {
  return (
    <Link href="/" className="brand" data-testid="link-home">
      <span className="brand-mark"><Scissors aria-hidden="true" /></span>
      <span>BarberLink</span>
    </Link>
  );
}

function SiteHeader() {
  const supportWhatsapp = String(import.meta.env.VITE_SUPPORT_WHATSAPP ?? '').replace(/\D/g, '');
  return (
    <header className="topbar">
      <Brand />
      <nav className="nav-links" aria-label="التنقل الرئيسي">
        <Link href="/discover" data-testid="link-discover">اكتشف الحلاقين</Link>
        <Link href="/my-bookings" data-testid="link-customer-bookings">طلباتي</Link>
        <Link href="/barber" data-testid="link-barber-portal">دخول الحلاق</Link>
        {supportWhatsapp.length >= 8 && supportWhatsapp.length <= 15 && (
          <a className="nav-support" href={`https://wa.me/${supportWhatsapp}`} target="_blank" rel="noreferrer" data-testid="link-whatsapp-support">
            دعم واتساب
          </a>
        )}
        <Link href="/join" className="nav-join" data-testid="link-join">انضم كحلاق</Link>
      </nav>
    </header>
  );
}

function Welcome() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<'role' | 'barber-type'>('role');
  const supportWhatsapp = String(import.meta.env.VITE_SUPPORT_WHATSAPP ?? '').replace(/\D/g, '');

  return (
    <div className="welcome-shell">
      <header className="welcome-header">
        <Brand />
        <span className="welcome-header-note">حلاقة قريبة منك، بخطوات أسهل</span>
        {supportWhatsapp.length >= 8 && supportWhatsapp.length <= 15 && (
          <a className="welcome-support" href={`https://wa.me/${supportWhatsapp}`} target="_blank" rel="noreferrer" data-testid="link-whatsapp-support-welcome">
            واتساب الدعم
          </a>
        )}
      </header>
      <main className="welcome-main">
        <div className="welcome-content">
          <div className="welcome-mark"><Scissors aria-hidden="true" /></div>
          <div className="section-label">مرحبًا بك في BarberLink</div>
          {step === 'role' ? (
            <>
              <h1>كيف تريد استخدام التطبيق؟</h1>
              <p className="welcome-description">اختر ما يناسبك لنوصلك مباشرة إلى الخطوة التالية.</p>
              <div className="welcome-options">
                <button
                  type="button"
                  className="welcome-option"
                  onClick={() => navigate('/discover')}
                  data-testid="button-role-customer"
                >
                  <span className="welcome-option-icon"><Search aria-hidden="true" /></span>
                  <span className="welcome-option-copy">
                    <strong>أبحث عن حلاق</strong>
                    <small>اكتشف الحلاقين والخدمات في منطقتك</small>
                  </span>
                  <ArrowLeft className="welcome-option-arrow" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="welcome-option"
                  onClick={() => setStep('barber-type')}
                  data-testid="button-role-barber"
                >
                  <span className="welcome-option-icon"><Scissors aria-hidden="true" /></span>
                  <span className="welcome-option-copy">
                    <strong>أنا حلاق أو حلاقة</strong>
                    <small>أنشئ ملفك واستقبل طلبات العملاء</small>
                  </span>
                  <ArrowLeft className="welcome-option-arrow" aria-hidden="true" />
                </button>
              </div>
            </>
          ) : (
            <>
              <button className="welcome-back" type="button" onClick={() => setStep('role')} data-testid="button-welcome-back">
                <ArrowRight aria-hidden="true" /> رجوع
              </button>
              <h1>هل أنت حلاق أم حلاقة؟</h1>
              <p className="welcome-description">اختر الصفة التي تناسبك للمتابعة إلى إنشاء ملفك.</p>
              <div className="welcome-options welcome-options-compact">
                <button
                  type="button"
                  className="welcome-option"
                  onClick={() => navigate('/join?gender=male')}
                  data-testid="button-barber-male"
                >
                  <span className="welcome-option-icon"><Scissors aria-hidden="true" /></span>
                  <span className="welcome-option-copy"><strong>حلاق</strong><small>أتابع كحلاق</small></span>
                  <ArrowLeft className="welcome-option-arrow" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="welcome-option"
                  onClick={() => navigate('/join?gender=female')}
                  data-testid="button-barber-female"
                >
                  <span className="welcome-option-icon"><Scissors aria-hidden="true" /></span>
                  <span className="welcome-option-copy"><strong>حلاقة</strong><small>أتابع كحلاقة</small></span>
                  <ArrowLeft className="welcome-option-arrow" aria-hidden="true" />
                </button>
              </div>
            </>
          )}
          <div className="welcome-footer"><ShieldCheck aria-hidden="true" /> ملفات الحلاقين تُراجع قبل ظهورها للعملاء</div>
        </div>
      </main>
    </div>
  );
}

function BarberImage({ barber, className = '' }: { barber: Barber; className?: string }) {
  const initials = barber.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('');
  return (
    <div className={`${className} ${barber.imageUrl ? '' : 'photo-placeholder'}`}>
      {barber.imageUrl ? (
        <img src={barber.imageUrl} alt={`صورة ${barber.name}`} />
      ) : (
        <span aria-label={`صورة رمزية لـ ${barber.name}`}>{initials}</span>
      )}
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="loading-grid" aria-label="جارٍ تحميل الحلاقين">
      {Array.from({ length: 3 }, (_, index) => (
        <div className="skeleton-card" key={index} aria-hidden="true">
          <div className="skeleton-block skeleton-photo" />
          <div className="skeleton-lines">
            <div className="skeleton-block skeleton-line short" />
            <div className="skeleton-block skeleton-line" />
            <div className="skeleton-block skeleton-line short" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorMessage({ onRetry, children }: { onRetry: () => void; children: ReactNode }) {
  return (
    <div className="status-banner error" role="alert" data-testid="status-load-error">
      <AlertCircle aria-hidden="true" />
      <span style={{ flex: 1 }}>{children}</span>
      <button className="retry-button" onClick={onRetry} type="button" data-testid="button-retry">
        <RefreshCw size={14} /> حاول مجددًا
      </button>
    </div>
  );
}

function BarberCard({
  barber,
  service,
  covered,
  showCoverage,
  onProfile,
  onBook,
}: {
  barber: Barber;
  service: Barber['services'][number];
  covered: boolean;
  showCoverage: boolean;
  onProfile: (id: number) => void;
  onBook: (id: number) => void;
}) {
  return (
    <article className="barber-card" data-testid={`card-barber-${barber.id}`}>
      <div className="barber-photo">
        <BarberImage barber={barber} />
        <span className={`availability ${barber.isAvailable ? 'is-available' : 'is-offline'}`}>
          <span /> {barber.isAvailable ? 'متاح الآن' : 'غير متاح الآن'}
        </span>
      </div>
      <div className="card-body">
        <div className="card-name-row">
          <h3 data-testid={`text-barber-name-${barber.id}`}>{barber.name}</h3>
          {barber.reviewCount > 0 && (
            <span className="rating" data-testid={`text-rating-${barber.id}`}>
              <Star aria-hidden="true" /> {new Intl.NumberFormat(getLocale() === 'ar' ? 'ar' : 'fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(barber.rating)} ({new Intl.NumberFormat(getLocale() === 'ar' ? 'ar' : 'fr-FR').format(barber.reviewCount)})
            </span>
          )}
        </div>
        <div className="location-line"><MapPin aria-hidden="true" /> {barber.city}</div>
        <p className="card-bio">{barber.bio}</p>
        <div className="service-line" data-testid={`text-service-${service.id}`}>
          <span>{service.name} · {service.durationMinutes} دقيقة</span>
          <strong>{money(service.price, barber.currency)}</strong>
        </div>
        {showCoverage && (
          <div className={`coverage-note ${covered ? 'covered' : ''}`} data-testid={`status-area-coverage-${barber.id}`}>
            <MapPin aria-hidden="true" />
            {covered ? 'منطقتك ضمن نطاق الخدمة المسجل' : 'التغطية في هذا الحي غير مدرجة'}
          </div>
        )}
        <div className="card-footer">
          <span className="travel-note">رسوم التنقل: {money(barber.travelFee, barber.currency)}</span>
          <div className="card-actions">
            <button className="text-button" type="button" onClick={() => onProfile(barber.id)} data-testid={`button-profile-${barber.id}`}>
              الملف
            </button>
            <button className="book-button" type="button" onClick={() => onBook(barber.id)} data-testid={`button-book-${barber.id}`}>
              اطلب موعدًا <ArrowLeft aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function Home() {
  const [mode, setMode] = useState<'browse' | 'suggest'>('browse');
  const [countryCode, setCountryCode] = useState<PaymentCountry['countryCode'] | ''>('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [searchText, setSearchText] = useState('');
  const [activeBarberId, setActiveBarberId] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<'profile' | 'booking' | null>(null);
  const [activeServiceId, setActiveServiceId] = useState('');
  const [suggestionReady, setSuggestionReady] = useState(false);
  const params = useMemo(() => countryCode ? ({ countryCode }) : ({}), [countryCode]);
  const countriesQuery = useListPaymentCountries({
    query: { queryKey: getListPaymentCountriesQueryKey(), staleTime: 60_000 },
  });
  const listQuery = useListBarbers(params, {
    query: { queryKey: getListBarbersQueryKey(params), refetchInterval: 15000, enabled: Boolean(countryCode) },
  });
  const health = useHealthCheck();
  const barberQuery = useGetBarber(activeBarberId ?? 0, {
    query: {
      enabled: activeBarberId !== null,
      queryKey: getGetBarberQueryKey(activeBarberId ?? 0),
    },
  });
  const barbers = (listQuery.data ?? []).filter((barber) => barber.status === 'active' && barber.countryCode === countryCode);
  const cities = [...new Set(barbers.map((barber) => barber.city).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const cityBarbers = barbers.filter((barber) => !city || barber.city.trim().toLocaleLowerCase() === city.trim().toLocaleLowerCase());
  const services = [...new Set(cityBarbers.flatMap((barber) => barber.services.map((service) => service.name)))].sort((a, b) => a.localeCompare(b));
  const matchingBarbers = city && serviceName
    ? cityBarbers
      .map((barber) => ({ barber, service: barber.services.find((item) => item.name === serviceName) }))
      .filter((match): match is { barber: Barber; service: Barber['services'][number] } => !!match.service)
      .sort((a, b) => {
        const aCovered = a.barber.areas.some((value) => value.trim().toLocaleLowerCase() === area.trim().toLocaleLowerCase());
        const bCovered = b.barber.areas.some((value) => value.trim().toLocaleLowerCase() === area.trim().toLocaleLowerCase());
        return Number(bCovered) - Number(aCovered) || b.barber.rating - a.barber.rating || b.barber.reviewCount - a.barber.reviewCount;
      })
    : [];
  const areaIsCovered = (barber: Barber) => Boolean(area.trim()) &&
    barber.areas.some((value) => value.trim().toLocaleLowerCase() === area.trim().toLocaleLowerCase());
  const coveredMatches = matchingBarbers.filter(({ barber }) => barber.isAvailable && areaIsCovered(barber));
  const searchedMatches = searchText.trim()
    ? matchingBarbers.filter(({ barber, service }) => {
      const term = searchText.trim().toLocaleLowerCase();
      return [barber.name, barber.city, barber.bio, ...barber.areas, service.name]
        .some((value) => value.toLocaleLowerCase().includes(term));
    })
    : matchingBarbers;
  const visibleMatches = mode === 'suggest' && suggestionReady ? coveredMatches.slice(0, 1) : searchedMatches;
  const openProfile = (id: number) => {
    const match = matchingBarbers.find((item) => item.barber.id === id);
    setActiveServiceId(match?.service.id ?? '');
    setActiveBarberId(id);
    setModalMode('profile');
  };
  const openBooking = (id: number) => {
    const match = matchingBarbers.find((item) => item.barber.id === id);
    setActiveServiceId(match?.service.id ?? '');
    setActiveBarberId(id);
    setModalMode('booking');
  };
  const closeModal = () => { setModalMode(null); setActiveBarberId(null); setActiveServiceId(''); };
  const clearCriteria = () => {
    setCountryCode('');
    setCity('');
    setArea('');
    setServiceName('');
    setSearchText('');
    setSuggestionReady(false);
  };

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="page-wrap discover-page">
        <section className="discover-intro">
          <div className="discover-intro-copy">
            <div className="section-label">اختيارك، بخطوة محلية</div>
            <h1>موعد حلاقة<br /><em>يبدأ من حيّك.</em></h1>
            <p>اختر حلاقًا بنفسك، أو دعنا نرشّح لك الأنسب حسب نطاق الخدمة المسجل وتقييم العملاء.</p>
          </div>
          <div className="discover-steps" aria-label="خطوات الطلب">
            <div className="discover-step"><span className="step-number">01</span><span>حدّد موقعك والخدمة</span></div>
            <i aria-hidden="true" />
            <div className="discover-step"><span className="step-number">02</span><span>اختر حلاقًا أو اطلب اقتراحًا</span></div>
            <i aria-hidden="true" />
            <div className="discover-step"><span className="step-number">03</span><span>تابع رد الحلاق</span></div>
          </div>
        </section>
        <section className="discovery-panel" aria-labelledby="discover-heading">
          <div className="discovery-heading">
            <div>
              <div className="section-label">ابدأ من التفاصيل</div>
              <h2 id="discover-heading">من أين نبدأ؟</h2>
            </div>
            <button className="clear-criteria" type="button" onClick={clearCriteria} data-testid="button-clear-filters">إعادة ضبط <X aria-hidden="true" /></button>
          </div>
          <div className="criteria-grid">
            <label className="field">
              <span>الدولة <b aria-hidden="true">*</b></span>
              <select
                value={countryCode}
                onChange={(event) => {
                  setCountryCode(event.target.value as PaymentCountry['countryCode'] | '');
                  setCity('');
                  setArea('');
                  setServiceName('');
                  setSuggestionReady(false);
                }}
                required
                aria-label="الدولة"
                data-testid="select-discover-country"
              >
                <option value="">اختر الدولة</option>
                {(countriesQuery.data ?? []).map((country) => (
                  <option key={country.countryCode} value={country.countryCode}>{country.countryName}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>المدينة <b aria-hidden="true">*</b></span>
              <select value={city} onChange={(event) => { setCity(event.target.value); setArea(''); setServiceName(''); setSuggestionReady(false); }} required disabled={!countryCode} aria-label="المدينة" data-testid="select-discover-city">
                <option value="">اختر المدينة</option>
                {cities.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="field">
              <span>الحي أو المنطقة {mode === 'suggest' && <b aria-hidden="true">*</b>}</span>
              <input list="registered-areas" value={area} onChange={(event) => { setArea(event.target.value); setSuggestionReady(false); }} placeholder="مثال: حي النخيل" required={mode === 'suggest'} minLength={2} maxLength={120} aria-label="الحي أو المنطقة" data-testid="input-discover-area" />
              <datalist id="registered-areas">{[...new Set(cityBarbers.flatMap((barber) => barber.areas))].sort().map((value) => <option key={value} value={value} />)}</datalist>
            </label>
            <label className="field">
              <span>الخدمة المطلوبة <b aria-hidden="true">*</b></span>
              <select value={serviceName} onChange={(event) => { setServiceName(event.target.value); setSuggestionReady(false); }} required disabled={!city} aria-label="الخدمة المطلوبة" data-testid="select-discover-service">
                <option value="">اختر الخدمة</option>
                {services.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </div>
          {countriesQuery.isLoading ? (
            <div className="country-loading" role="status">جارٍ تحميل الدول المدعومة…</div>
          ) : countriesQuery.isError ? (
            <ErrorMessage onRetry={() => void countriesQuery.refetch()}>تعذّر تحميل الدول. أعد المحاولة للمتابعة.</ErrorMessage>
          ) : mode === 'browse' && (
            <label className="search-control discover-search-control">
              <Search aria-hidden="true" />
              <input
                type="search"
                placeholder="ابحث عن حلاق أو خدمة أو منطقة"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                aria-label="ابحث عن حلاق أو خدمة أو منطقة"
                data-testid="input-search"
              />
            </label>
          )}
          <div className="mode-switch" role="group" aria-label="طريقة اختيار الحلاق">
            <button type="button" aria-pressed={mode === 'browse'} className={mode === 'browse' ? 'selected' : ''} onClick={() => { setMode('browse'); setSuggestionReady(false); }} data-testid="button-mode-browse">
              <Search aria-hidden="true" /><span><strong>أختار بنفسي</strong><small>تصفّح الحلاقين المناسبين</small></span>
            </button>
            <button type="button" aria-pressed={mode === 'suggest'} className={mode === 'suggest' ? 'selected' : ''} onClick={() => { setMode('suggest'); setSuggestionReady(false); }} data-testid="button-mode-suggest">
              <HeartHandshake aria-hidden="true" /><span><strong>اقترح لي حلاقًا</strong><small>ترشيح حسب المنطقة والتقييم</small></span>
            </button>
          </div>
          {mode === 'suggest' && (
            <div className="suggest-action">
              <div><strong>ترشيح من بيانات الحلاقين المسجلين</strong><small>نرتّب التغطية المطابقة أولًا، ثم التقييم وعدد المراجعات.</small></div>
              <button type="button" className="book-button" disabled={!countryCode || !city || !area.trim() || !serviceName} onClick={() => setSuggestionReady(true)} data-testid="button-find-suggestion">
                اعثر على الأنسب <ArrowLeft aria-hidden="true" />
              </button>
            </div>
          )}
          <div className="results-meta discover-results-meta">
            <span><strong>{listQuery.isLoading ? '—' : (mode === 'suggest' && suggestionReady ? visibleMatches.length : matchingBarbers.length)}</strong> نتيجة مناسبة</span>
            {countryCode && city && serviceName && <span className="criteria-caption">{countriesQuery.data?.find((country) => country.countryCode === countryCode)?.countryName} · {city}{area ? ` · ${area}` : ''} · {serviceName}</span>}
          </div>
          {health.data?.status && <span className="health-state" data-testid="status-api">الخدمة متصلة</span>}
          <p className="coverage-disclaimer" data-testid="text-coverage-disclaimer"><MapPin aria-hidden="true" /> التغطية مبنية على مناطق الخدمة المسجلة لدى الحلاقين، وليست قياسًا للمسافة أو التوفر الفوري.</p>
          {!countryCode ? (
            <div className="discovery-prompt" data-testid="status-discovery-prompt">
              <div className="empty-icon"><MapPin aria-hidden="true" /></div>
              <div><h3>ابدأ باختيار الدولة</h3><p>بعد تحديد الدولة ستظهر المدن والخدمات والحلاقون المتاحون فيها فقط.</p></div>
            </div>
          ) : listQuery.isLoading ? <LoadingCards /> : listQuery.isError ? (
            <ErrorMessage onRetry={() => void listQuery.refetch()}>تعذّر تحميل الحلاقين الآن. تحقق من اتصالك ثم أعد المحاولة.</ErrorMessage>
          ) : !city || !serviceName || (mode === 'suggest' && !area.trim()) ? (
            <div className="discovery-prompt" data-testid="status-discovery-prompt">
              <div className="empty-icon"><MapPin aria-hidden="true" /></div>
              <div><h3>ابدأ بالمدينة والخدمة{mode === 'suggest' ? ' والحي' : ''}</h3><p>سنُظهر حلاقين نشطين يقدمون الخدمة نفسها{mode === 'suggest' ? ' ويغطون منطقتك المسجلة' : ''}.</p></div>
            </div>
          ) : mode === 'suggest' && !suggestionReady ? (
            <div className="discovery-prompt compact" data-testid="status-suggestion-ready">
              <div className="empty-icon"><HeartHandshake aria-hidden="true" /></div>
              <div><h3>جاهز لاقتراح مناسب</h3><p>سيعتمد الترشيح على نطاق التغطية المسجل ثم التقييم وعدد المراجعات.</p></div>
            </div>
          ) : visibleMatches.length === 0 ? (
            <div className="empty-state discover-empty" data-testid="status-empty-barbers">
              <div className="empty-icon"><Scissors aria-hidden="true" /></div>
              <h3>{mode === 'suggest' && suggestionReady && coveredMatches.length === 0 ? 'لا يوجد تطابق في نطاق التغطية' : 'لم نجد حلاقًا بهذه المواصفات'}</h3>
              <p>{mode === 'suggest' && suggestionReady && coveredMatches.length === 0
                ? `لا يوجد حلاق نشط مسجل لتغطية «${area}» ويقدم «${serviceName}». جرّب اختيار حلاق بنفسك أو غيّر المنطقة.`
                : `لا يوجد حلاق نشط في ${city} يقدم خدمة «${serviceName}» حاليًا. جرّب خدمة أو مدينة أخرى.`}</p>
              <button className="retry-button" onClick={clearCriteria} type="button" data-testid="button-empty-clear">تغيير التفاصيل</button>
            </div>
          ) : (
            <>
              {mode === 'suggest' && suggestionReady && (
                <div className="suggestion-note" data-testid="status-suggestion-result"><Check aria-hidden="true" /> هذا الترشيح مبني على بيانات نطاق الخدمة والتقييم، وليس على موقع GPS أو التوفر الفوري.</div>
              )}
              {mode === 'browse' && area.trim() && coveredMatches.length === 0 && (
                <div className="status-banner area-warning" role="status" data-testid="status-no-area-coverage">
                  <MapPin aria-hidden="true" /> لا يوجد تطابق مسجل لهذا الحي تحديدًا. الخيارات أدناه تقدم الخدمة في مدينتك؛ يُرجى التأكد من التغطية قبل إرسال الطلب.
                </div>
              )}
              <div className="barber-grid" data-testid="list-barbers">
                {visibleMatches.map(({ barber, service }) => (
                  <BarberCard
                    key={barber.id}
                    barber={barber}
                    service={service}
                    covered={areaIsCovered(barber)}
                    showCoverage={Boolean(area.trim())}
                    onProfile={openProfile}
                    onBook={openBooking}
                  />
                ))}
              </div>
            </>
          )}
        </section>
        <section className="trust-strip" aria-label="مزايا الخدمة">
          <div className="trust-copy"><ShieldCheck aria-hidden="true" /> ملفات الحلاقين تُراجع قبل ظهورها</div>
          <div className="trust-stats">
            <span><strong>طلب مباشر</strong> والحلاق يؤكد الموعد</span>
            <span><strong>نطاق واضح</strong> حسب مناطق التغطية</span>
          </div>
        </section>
        <footer className="footer discover-footer">
          <div className="footer-brand"><span className="brand-mark"><Scissors aria-hidden="true" /></span> BarberLink</div>
          <span>كل طلب ينتظر رد الحلاق قبل أن يصبح موعدًا مؤكدًا.</span>
          <span className="discover-footer-links">
            <Link href="/my-bookings" data-testid="link-discover-bookings">متابعة طلباتي</Link>
            <Link href="/join" data-testid="link-footer-join">هل أنت حلاق متنقل؟ انضم إلينا</Link>
          </span>
        </footer>
      </main>
      {modalMode && activeBarberId !== null && (
        <BarberModal
          mode={modalMode}
          barber={barberQuery.data}
          isLoading={barberQuery.isLoading}
          isError={barberQuery.isError}
          onRetry={() => void barberQuery.refetch()}
          onClose={closeModal}
          onBook={() => setModalMode('booking')}
          selectedServiceId={activeServiceId}
          initialCity={city}
          initialArea={area}
        />
      )}
    </div>
  );
}

function BarberModal({
  mode,
  barber,
  isLoading,
  isError,
  onRetry,
  onClose,
  onBook,
  selectedServiceId,
  initialCity,
  initialArea,
}: {
  mode: 'profile' | 'booking';
  barber?: Barber;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onClose: () => void;
  onBook: () => void;
  selectedServiceId: string;
  initialCity: string;
  initialArea: string;
}) {
  const [confirmation, setConfirmation] = useState<{
    id: number;
    status: string;
    barberName: string;
    barberPhone: string;
    serviceName: string;
    servicePrice: number;
    travelFee: number;
    currency: string;
    date: string | Date;
    time: string;
    attemptCount: number;
  } | null>(null);
  const booking = useCreateBooking();
  const countriesQuery = useListPaymentCountries({
    query: { queryKey: getListPaymentCountriesQueryKey(), staleTime: 60_000 },
  });
  const [formError, setFormError] = useState('');
  const [locationMode, setLocationMode] = useState<'manual' | 'gps'>('manual');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [contactDetails, setContactDetails] = useState<{ name: string; phone: string; area: string } | null>(null);
  const dateInput = useRef<HTMLInputElement>(null);
  const minDate = new Date().toLocaleDateString('en-CA');
  const whatsappPhone = confirmation?.barberPhone.replace(/\D/g, '') ?? '';
  const whatsappMessage = confirmation
    ? getLocale() === 'ar'
      ? `مرحبًا ${confirmation.barberName}، أرسلت طلب الموعد رقم ${confirmation.id}.\nالخدمة: ${confirmation.serviceName}\nالتاريخ: ${dateLabel(confirmation.date)} الساعة ${confirmation.time}\nالاسم: ${contactDetails?.name ?? ''}\nهاتف التواصل: ${contactDetails?.phone ?? ''}\nالمنطقة: ${contactDetails?.area ?? ''}\nأرجو تأكيد الموعد.`
      : `Bonjour ${confirmation.barberName}, j’ai envoyé la demande de rendez-vous n° ${confirmation.id}.\nService : ${confirmation.serviceName}\nDate : ${dateLabel(confirmation.date)} à ${confirmation.time}\nNom : ${contactDetails?.name ?? ''}\nTéléphone : ${contactDetails?.phone ?? ''}\nQuartier : ${contactDetails?.area ?? ''}\nMerci de confirmer le rendez-vous.`
    : '';
  const requestedService = barber?.services.find((service) => service.id === selectedServiceId) ?? barber?.services[0];
  const saveTrackingReference = (bookingId: number, token: string) => {
    const stored = readCustomerBookings();
    const updated = [{ id: bookingId, token }, ...stored.filter((item) => item.id !== bookingId)];
    window.localStorage.setItem('barberlink_customer_bookings', JSON.stringify(updated));
  };

  const submitBooking = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!barber || !requestedService || !barber.countryCode) {
      setFormError('لا يمكن إرسال الطلب لهذا الملف لعدم تحديد الدولة.');
      return;
    }
    const form = new FormData(event.currentTarget);
    const area = String(form.get('area') || '').trim();
    if (locationMode === 'manual' && area.length < 2) {
      setFormError('أدخل الحي أو شارك موقعك بموافقتك.');
      return;
    }
    if (locationMode === 'gps' && !coordinates) {
      setFormError('شارك موقعك أولًا، أو اختر إدخال المنطقة يدويًا.');
      return;
    }
    const payload: BookingInput = {
      serviceName: requestedService.name,
      countryCode: barber.countryCode,
      city: initialCity || barber.city,
      locationMode,
      customerName: String(form.get('customerName') || '').trim(),
      customerPhone: String(form.get('customerPhone') || '').trim(),
      area: locationMode === 'manual' ? area : null,
      latitude: locationMode === 'gps' ? coordinates?.latitude : null,
      longitude: locationMode === 'gps' ? coordinates?.longitude : null,
      date: String(form.get('date') || ''),
      time: String(form.get('time') || ''),
      note: String(form.get('note') || '').trim() || null,
    };
    setContactDetails({
      name: payload.customerName,
      phone: payload.customerPhone,
      area: payload.area || 'موقعي الحالي',
    });
    setFormError('');
    booking.mutate({ data: payload }, {
      onSuccess: (result) => {
        saveTrackingReference(result.id, result.trackingToken);
        setConfirmation(result);
      },
      onError: (error) => {
        const apiMessage = (error as { data?: { error?: string } })?.data?.error ?? '';
        setFormError(
          apiMessage.includes('No available barber')
            ? 'لا يوجد حلاق متاح لهذه الخدمة والمنطقة الآن. جرّب إدخال منطقة أخرى أو أعد المحاولة لاحقًا.'
            : 'تعذّر إرسال طلبك. تحقق من البيانات والاتصال ثم حاول مرة أخرى.',
        );
      },
    });
  };

  const shareLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('المتصفح لا يدعم تحديد الموقع. يمكنك إدخال المنطقة يدويًا.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationMode('gps');
        setFormError('');
      },
      () => {
        setLocationError('لم نتمكن من الوصول إلى موقعك. اختر إدخال المنطقة يدويًا للمتابعة.');
        setLocationMode('manual');
        setCoordinates(null);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={confirmation ? 'تأكيد طلب الحجز' : mode === 'booking' ? 'طلب موعد' : 'ملف الحلاق'}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="إغلاق" data-testid="button-close-modal"><X /></button>
        {isLoading ? (
          <div className="empty-state" style={{ border: 0 }}><div className="empty-icon"><Scissors /></div><h3>جارٍ تحميل الملف</h3><p>لحظات ونكون جاهزين.</p></div>
        ) : isError || !barber ? (
          <div style={{ padding: 60 }}><ErrorMessage onRetry={onRetry}>تعذّر تحميل ملف الحلاق.</ErrorMessage></div>
        ) : confirmation ? (
          <div className="confirmation" data-testid="status-booking-success">
            <div className="success-mark"><Check aria-hidden="true" /></div>
            <div className="eyebrow">وصل طلبك</div>
            <h2>تم إرسال طلب الموعد</h2>
            <p>أرسلنا طلبك إلى حلاق متاح مناسب لموقعك. ستظهر موافقته أو انتقال الطلب إلى حلاق بديل في صفحة «طلباتي».</p>
            <div className="confirmation-details">
              <div>الحلاق: <strong>{confirmation.barberName}</strong></div>
              <div>الخدمة: <strong>{confirmation.serviceName}</strong></div>
              <div>السعر: <strong>{money(confirmation.servicePrice, confirmation.currency)}</strong> · التنقل: <strong>{money(confirmation.travelFee, confirmation.currency)}</strong></div>
              <div>التاريخ والوقت: <strong>{dateLabel(confirmation.date)}، {confirmation.time}</strong></div>
              <div>رقم الطلب: <strong>#{confirmation.id}</strong></div>
            <div>الحالة: <strong>تم إرسال الطلب · المحاولة {confirmation.attemptCount.toLocaleString(getLocale() === 'ar' ? 'ar' : 'fr-FR')}</strong></div>
            </div>
            <Link href="/my-bookings" className="submit-button" onClick={onClose} data-testid="link-track-booking">متابعة حالة الطلب</Link>
            {whatsappPhone && (
              <a
                className="submit-button"
                href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noreferrer"
                data-testid="link-contact-barber"
              >
                إرسال التفاصيل للحلاق عبر واتساب
              </a>
            )}
            <button className="text-button" type="button" onClick={onClose} data-testid="button-booking-done">إغلاق</button>
          </div>
        ) : mode === 'profile' ? (
          <>
            <div className="profile-hero"><BarberImage barber={barber} /></div>
            <div className="profile-content">
              <div className="profile-title">
                <div>
                  <h2 data-testid={`text-profile-name-${barber.id}`}>{barber.name}</h2>
                  <div className="location-line"><MapPin /> {barber.city}</div>
                </div>
                {barber.reviewCount > 0 && <span className="rating"><Star /> {barber.rating.toFixed(1)} ({barber.reviewCount})</span>}
              </div>
              <p className="bio">{barber.bio}</p>
              <div className="area-tags">{barber.areas.map((area) => <span className="area-tag" key={area}>{area}</span>)}</div>
              <div className="section-label" style={{ marginBottom: 5 }}>الخدمات والأسعار</div>
              {barber.services.map((service) => (
                <div className="profile-service" key={service.id} data-testid={`profile-service-${service.id}`}>
                  <span><strong>{service.name}</strong><small><Clock3 size={12} /> {service.durationMinutes} دقيقة</small></span>
                  <b>{money(service.price, barber.currency)}</b>
                </div>
              ))}
              <div className="profile-service">
                <span><strong>رسوم التنقل</strong><small>تُضاف إلى قيمة الخدمة</small></span>
                <b>{money(barber.travelFee, barber.currency)}</b>
              </div>
              <button className="submit-button" type="button" onClick={onBook} data-testid="button-profile-book">
                <CalendarDays aria-hidden="true" /> اطلب موعدًا
              </button>
            </div>
          </>
        ) : (
          <form className="booking-form" onSubmit={submitBooking}>
            <div className="booking-topline">خطوة واحدة تفصلك عن موعدك</div>
            <h2>اطلب أقرب حلاق متاح</h2>
            <p>سنبحث عن حلاق متاح في {initialCity || barber.city} يقدّم الخدمة ويغطي موقعك.</p>
            <div className="booking-summary" data-testid="booking-summary">
              <span><strong>{barber.city}</strong><small>{requestedService?.name ?? 'الخدمة'} · {requestedService?.durationMinutes ?? 0} دقيقة</small></span>
              <span className="booking-price">السعر يحدده الحلاق المتاح<small>يظهر السعر قبل تأكيد الموعد</small></span>
            </div>
            {formError && <div className="status-banner error" role="alert"><AlertCircle />{formError}</div>}
            <input type="hidden" name="serviceId" value={requestedService?.id ?? ''} />
            <div className="form-grid">
              <div className="field">
                <label htmlFor="booking-name">الاسم</label>
                <input id="booking-name" name="customerName" required minLength={2} maxLength={100} placeholder="اسمك الكامل" data-testid="input-customer-name" />
              </div>
              <div className="field">
                <label htmlFor="booking-phone">رقم الهاتف</label>
                <input id="booking-phone" name="customerPhone" type="tel" required minLength={7} maxLength={30} placeholder="رقم يمكن التواصل عليه" data-testid="input-customer-phone" />
              </div>
            </div>
            <fieldset className="location-choice">
              <legend>كيف تحدد موقعك؟</legend>
              <label>
                <input type="radio" name="locationMode" checked={locationMode === 'manual'} onChange={() => setLocationMode('manual')} />
                <span>أدخل المنطقة يدويًا</span>
              </label>
              <label>
                <input type="radio" name="locationMode" checked={locationMode === 'gps'} onChange={() => setLocationMode('gps')} />
                <span>استخدم موقعي بموافقتي</span>
              </label>
              {locationMode === 'manual' ? (
                <div className="field">
                  <label htmlFor="booking-area">الحي أو المنطقة</label>
                  <input id="booking-area" name="area" required minLength={2} maxLength={120} defaultValue={initialArea} placeholder="أين ترغب باستقبال الحلاق؟" data-testid="input-booking-area" />
                </div>
              ) : (
                <div className="location-share">
                  <button className="admin-secondary-button" type="button" onClick={shareLocation} data-testid="button-share-customer-location">
                    <MapPin size={15} /> {coordinates ? 'تم تحديد موقعي' : 'مشاركة موقعي'}
                  </button>
                  <small>لن نطلب الموقع إلا بعد ضغطك على الزر. نستخدمه لاختيار حلاق ضمن 30 كم.</small>
                </div>
              )}
              {(locationError || (locationMode === 'gps' && !coordinates)) && (
                <small className="location-error" role="status">{locationError || 'اضغط مشاركة موقعي للسماح بالوصول إلى موقعك.'}</small>
              )}
            </fieldset>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="booking-date">التاريخ</label>
                <input ref={dateInput} id="booking-date" name="date" type="date" min={minDate} required data-testid="input-booking-date" />
              </div>
              <div className="field">
                <label htmlFor="booking-time">الوقت</label>
                <input id="booking-time" name="time" type="time" required data-testid="input-booking-time" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="booking-note">ملاحظة للحلاق <span style={{ fontWeight: 400 }}>(اختياري)</span></label>
              <textarea id="booking-note" name="note" maxLength={500} placeholder="تفاصيل تساعد الحلاق على الاستعداد" data-testid="input-booking-note" />
            </div>
              <div className="payment-preparation" data-testid="status-payment-preparation">
                <CreditCard aria-hidden="true" />
                <span>
                  {countriesQuery.isLoading ? 'جارٍ تحميل إعداد الدفع لهذه الدولة…' : countriesQuery.isError
                    ? 'تعذّر تحميل إعداد الدفع لهذه الدولة.'
                    : (() => {
                      const paymentCountry = countriesQuery.data?.find((item) => item.countryCode === barber.countryCode);
                      if (!paymentCountry) return 'إعداد الدفع لهذه الدولة غير متاح حاليًا.';
                      const preference = paymentCountry.enabled ? 'إعداد الدولة مفعّل' : 'إعداد الدولة غير مفعّل';
                      const readiness = paymentCountry.providerReady ? 'مزود الدفع جاهز' : 'مزود الدفع غير مهيأ بعد';
                      const accepting = paymentCountry.acceptingPayments ? 'الدفع الإلكتروني متاح' : 'الدفع الإلكتروني غير متاح';
                      return `${paymentCountry.countryName} · ${preference} · ${readiness} · ${accepting}. لا يتم تحصيل أي مبلغ الآن.`;
                    })()}
                </span>
              </div>
            {!barber.countryCode && <div className="status-banner error" role="alert">لا يمكن إرسال طلب لهذا الملف قبل تحديد دولته.</div>}
            <button className="submit-button" type="submit" disabled={booking.isPending || !barber.countryCode} data-testid="button-submit-booking">
              {booking.isPending ? 'جارٍ إرسال الطلب…' : <>إرسال طلب الموعد <ArrowLeft aria-hidden="true" /></>}
            </button>
            <div className="small-print">إرسال الطلب لا يعني تأكيد الموعد. لا تكتب عنوان المنزل الكامل هنا؛ شاركه مباشرة مع الحلاق بعد تأكيد الموعد.</div>
          </form>
        )}
      </section>
    </div>
  );
}

type ServiceDraft = { name: string; durationMinutes: string; price: string };

function Join() {
  const barberGender = new URLSearchParams(window.location.search).get('gender');
  const createBarber = useCreateBarber();
  const countriesQuery = useListPaymentCountries({
    query: { queryKey: getListPaymentCountriesQueryKey(), staleTime: 60_000 },
  });
  const [selectedCountryCode, setSelectedCountryCode] = useState<PaymentCountry['countryCode'] | ''>('');
  const selectedCountry = countriesQuery.data?.find((country) => country.countryCode === selectedCountryCode);
  const [services, setServices] = useState<ServiceDraft[]>([{ name: '', durationMinutes: '30', price: '' }]);
  const serviceCounter = useRef(1);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState<{ id: number; message: string; accessCode: string } | null>(null);

  const updateService = (index: number, field: keyof ServiceDraft, value: string) => {
    setServices((current) => current.map((service, currentIndex) => currentIndex === index ? { ...service, [field]: value } : service));
  };
  const addService = () => {
    serviceCounter.current += 1;
    setServices((current) => [...current, { name: '', durationMinutes: '30', price: '' }]);
  };
  const removeService = (index: number) => setServices((current) => current.length > 1 ? current.filter((_, currentIndex) => currentIndex !== index) : current);

  const submitProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    if (password !== String(form.get('passwordConfirm') || '')) {
      setFormError('كلمتا المرور غير متطابقتين.');
      return;
    }
    const serviceInputs = services.map((service, index) => ({
      id: `service-${index + 1}`,
      name: service.name.trim(),
      durationMinutes: Number(service.durationMinutes),
      price: Number(service.price),
    }));
    const payload: BarberInput = {
      name: String(form.get('name') || '').trim(),
      countryCode: String(form.get('countryCode') || '') as PaymentCountry['countryCode'],
      city: String(form.get('city') || '').trim(),
      areas: String(form.get('areas') || '').split(/[،,]/).map((area) => area.trim()).filter(Boolean),
      bio: String(form.get('bio') || '').trim(),
      phone: String(form.get('phone') || '').trim(),
      email: String(form.get('email') || '').trim().toLowerCase(),
      password,
      travelFee: Number(form.get('travelFee') || 0),
      currency: selectedCountry?.currency ?? '',
      services: serviceInputs,
    };
    setFormError('');
    createBarber.mutate({ data: payload }, {
      onSuccess: (result) => setSuccess({ id: result.id, message: result.message, accessCode: result.accessCode }),
      onError: () => setFormError('تعذّر إرسال الملف. تحقق من الحقول، وتأكد أن البريد غير مسجل من قبل.'),
    });
  };

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="page-wrap">
        <div className="page-heading">
          <div className="section-label">{barberGender === 'female' ? 'انضمي كحلاقة' : barberGender === 'male' ? 'انضم كحلاق' : 'للمحترفين المستقلين'}</div>
          <h1>خلّ خبرتك توصل<br />إلى باب عملائك.</h1>
          <p>أنشئ ملفك كحلاق متنقل. بعد المراجعة، يستطيع العملاء القريبون منك اكتشاف خدماتك وإرسال طلبات حجز مباشرة.</p>
        </div>
        {success ? (
          <section className="confirmation form-panel" style={{ maxWidth: 660, margin: '0 auto' }} data-testid="status-join-success">
            <div className="success-mark"><Check aria-hidden="true" /></div>
            <div className="eyebrow">استلمنا ملفك</div>
            <h2>خطوتك التالية وصلت إلينا</h2>
            <p>شكرًا لانضمامك. سيراجع فريقنا معلوماتك قبل إظهار ملفك للعملاء.</p>
            <div className="confirmation-details">رقم الطلب: <strong>#{success.id}</strong><br />الحالة: <strong>قيد المراجعة</strong></div>
            <div className="access-code-panel">
              <strong>رمز دخولك إلى لوحة الحلاق</strong>
              <code>{success.accessCode}</code>
              <p>استخدم بريدك وكلمة المرور للدخول. احتفظ برقم الملف والرمز الاحتياطي؛ لن نعرض الرمز مرة أخرى، وستحتاج إليه إذا نسيت كلمة المرور.</p>
              <button
                type="button"
                className="admin-secondary-button"
                onClick={async () => {
                  const value = `${success.id}:${success.accessCode}`;
                  try {
                    await navigator.clipboard.writeText(value);
                  } catch {
                    window.prompt('انسخ رقم الحلاق ورمز الاسترداد', value);
                  }
                }}
              >
                <Clipboard size={15} /> نسخ رقم الحلاق ورمز الاسترداد
              </button>
            </div>
            <Link href="/barber" className="submit-button" data-testid="link-barber-dashboard">فتح لوحة الحلاق</Link>
            <Link href="/discover" className="submit-button" data-testid="link-join-home">العودة إلى اكتشاف الحلاقين</Link>
          </section>
        ) : (
          <div className="join-layout">
            <form className="form-panel" onSubmit={submitProfile} data-testid="form-join">
              <h2 className="form-section-title">معلومات ملفك</h2>
              {formError && <div className="status-banner error" role="alert" style={{ marginBottom: 18 }}><AlertCircle />{formError}</div>}
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="barber-name">الاسم الذي يعرفك به العملاء</label>
                  <input id="barber-name" name="name" required minLength={2} maxLength={100} placeholder="الاسم الكامل" data-testid="input-barber-name" />
                </div>
                <div className="field">
                  <label htmlFor="barber-country">الدولة</label>
                  <select
                    id="barber-country"
                    name="countryCode"
                    value={selectedCountryCode}
                    onChange={(event) => setSelectedCountryCode(event.target.value as PaymentCountry['countryCode'] | '')}
                    required
                    data-testid="select-barber-country"
                  >
                    <option value="">اختر الدولة</option>
                    {(countriesQuery.data ?? []).map((country) => <option key={country.countryCode} value={country.countryCode}>{country.countryName}</option>)}
                  </select>
                  {countriesQuery.isLoading && <small role="status">جارٍ تحميل الدول…</small>}
                  {countriesQuery.isError && (
                    <small className="field-error" role="alert">
                      تعذّر تحميل الدول. <button className="inline-retry" type="button" onClick={() => void countriesQuery.refetch()} data-testid="button-join-countries-retry">أعد المحاولة</button>
                    </small>
                  )}
                </div>
                <div className="field">
                  <label htmlFor="barber-city">المدينة</label>
                  <input id="barber-city" name="city" required minLength={2} maxLength={100} placeholder="المدينة التي تعمل فيها" data-testid="input-barber-city" />
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="barber-email">البريد الإلكتروني للدخول</label>
                  <input id="barber-email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="name@example.com" data-testid="input-barber-email" />
                </div>
                <div className="field">
                  <label htmlFor="barber-password">كلمة المرور</label>
                  <input id="barber-password" name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" placeholder="12 حرفًا على الأقل" data-testid="input-barber-password" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="barber-password-confirm">تأكيد كلمة المرور</label>
                <input id="barber-password-confirm" name="passwordConfirm" type="password" required minLength={12} maxLength={128} autoComplete="new-password" placeholder="أعد كتابة كلمة المرور" data-testid="input-barber-password-confirm" />
              </div>
              <div className="small-print" style={{ margin: '-4px 0 17px' }}>لا نرسل رسالة تحقق حاليًا؛ تأكد من صحة البريد واحفظ رمز الاسترداد الظاهر بعد التسجيل.</div>
              <div className="field">
                <label htmlFor="barber-areas">الأحياء أو المناطق التي تغطيها</label>
                <input id="barber-areas" name="areas" required placeholder="افصل بين المناطق بفاصلة" data-testid="input-barber-areas" />
                <small>مثال: الحي القديم، وسط المدينة، الضواحي الشمالية</small>
              </div>
              <div className="field">
                <label htmlFor="barber-bio">نبذة قصيرة عنك</label>
                <textarea id="barber-bio" name="bio" required minLength={10} maxLength={500} placeholder="عرّف العملاء بخبرتك وطريقتك في العمل." data-testid="input-barber-bio" />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="barber-phone">رقم الهاتف</label>
                  <input id="barber-phone" name="phone" type="tel" required minLength={7} maxLength={30} placeholder="رقم للتواصل معك" data-testid="input-barber-phone" />
                </div>
                <div className="field">
                  <label htmlFor="barber-currency">رمز العملة</label>
                  <input id="barber-currency" name="currency" value={selectedCountry?.currency ?? ''} readOnly required minLength={3} maxLength={3} pattern="[A-Za-z]{3}" placeholder="يُحدد حسب الدولة" data-testid="input-barber-currency" />
                  <small>تُحدد العملة تلقائيًا حسب الدولة المختارة.</small>
                </div>
              </div>
              <div className="field" style={{ maxWidth: 300 }}>
                <label htmlFor="barber-travel-fee">رسوم التنقل ({' '}بالعملة المحددة)</label>
                <input id="barber-travel-fee" name="travelFee" type="number" min="0" max="10000" step="0.01" required placeholder="0" data-testid="input-barber-travel-fee" />
              </div>
              <h2 className="form-section-title" style={{ marginTop: 24 }}>الخدمات التي تقدمها</h2>
              {services.map((service, index) => (
                <div className="service-editor" key={index} data-testid={`service-editor-${index}`}>
                  <div className="service-editor-head">
                    <span>الخدمة {index + 1}</span>
                    {services.length > 1 && (
                      <button className="icon-button" type="button" onClick={() => removeService(index)} aria-label={`حذف الخدمة ${index + 1}`} data-testid={`button-remove-service-${index}`}>
                        <Trash2 aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <div className="service-fields">
                    <div className="field">
                      <label htmlFor={`service-name-${index}`}>اسم الخدمة</label>
                      <input id={`service-name-${index}`} required minLength={2} maxLength={80} value={service.name} onChange={(event) => updateService(index, 'name', event.target.value)} placeholder="قص شعر" data-testid={`input-service-name-${index}`} />
                    </div>
                    <div className="field">
                      <label htmlFor={`service-duration-${index}`}>المدة بالدقائق</label>
                      <input id={`service-duration-${index}`} type="number" min="10" max="240" required value={service.durationMinutes} onChange={(event) => updateService(index, 'durationMinutes', event.target.value)} data-testid={`input-service-duration-${index}`} />
                    </div>
                    <div className="field">
                      <label htmlFor={`service-price-${index}`}>السعر</label>
                      <input id={`service-price-${index}`} type="number" min="0" max="10000" step="0.01" required value={service.price} onChange={(event) => updateService(index, 'price', event.target.value)} data-testid={`input-service-price-${index}`} />
                    </div>
                  </div>
                </div>
              ))}
              <button className="add-service" type="button" onClick={addService} data-testid="button-add-service"><Plus aria-hidden="true" /> إضافة خدمة أخرى</button>
              <button className="submit-button" type="submit" disabled={createBarber.isPending} data-testid="button-submit-barber">
                {createBarber.isPending ? 'جارٍ إرسال ملفك…' : <>إرسال الملف للمراجعة <ArrowLeft aria-hidden="true" /></>}
              </button>
              <div className="small-print">إرسال الملف لا يعني نشره فورًا. نراجع المعلومات قبل عرضها على العملاء.</div>
            </form>
            <aside className="side-note">
              <div className="side-note-icon"><HeartHandshake aria-hidden="true" /></div>
              <h3>العمل الجيد يستحق أن يُرى.</h3>
              <p>BarberLink يقرّبك من أشخاص في منطقتك يبحثون عن خدمة شخصية موثوقة.</p>
              <div className="side-step"><b>١</b><span>شارك خبرتك، مناطق التغطية، والخدمات التي تقدمها.</span></div>
              <div className="side-step"><b>٢</b><span>نراجع ملفك قبل نشره على المنصة.</span></div>
              <div className="side-step"><b>٣</b><span>تصلك طلبات حجز حقيقية من عملاء قريبين.</span></div>
              <div className="small-print">تأكد أن رقم هاتفك صحيح حتى يتمكن العملاء من الوصول إليك.</div>
            </aside>
          </div>
        )}
        <footer className="footer">
          <div className="footer-brand"><span className="brand-mark"><Scissors aria-hidden="true" /></span> BarberLink</div>
          <Link href="/discover" data-testid="link-join-footer-home"><ArrowRight size={14} /> العودة للاكتشاف</Link>
        </footer>
      </main>
    </div>
  );
}

function Admin() {
  const queryClient = useQueryClient();
  const session = useGetAdminSession({
    query: { queryKey: getGetAdminSessionQueryKey(), retry: false, staleTime: 0 },
  });
  const authenticated = session.data?.authenticated === true;
  const pending = useListPendingBarbers({
    query: {
      queryKey: getListPendingBarbersQueryKey(),
      enabled: authenticated,
      retry: false,
      staleTime: 0,
    },
  });
  const activeBarbers = useListBarbers({}, {
    query: {
      queryKey: getListBarbersQueryKey({}),
      enabled: authenticated,
      retry: false,
    },
  });
  const paymentCountries = useListAdminPaymentCountries({
    query: {
      queryKey: getListAdminPaymentCountriesQueryKey(),
      enabled: authenticated,
      retry: false,
      staleTime: 0,
    },
  });
  const login = useLoginAdmin();
  const logout = useLogoutAdmin();
  const moderate = useModerateBarber();
  const issueAccessCode = useIssueBarberAccessCode();
  const updatePaymentCountry = useUpdateAdminPaymentCountry();
  const [loginError, setLoginError] = useState('');
  const [decisionError, setDecisionError] = useState('');
  const [busyBarber, setBusyBarber] = useState<number | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [issuedAccessCode, setIssuedAccessCode] = useState<{ barberId: number; accessCode: string } | null>(null);
  const [accessCodeError, setAccessCodeError] = useState('');
  const [paymentFeedback, setPaymentFeedback] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const savePaymentPreference = (country: PaymentCountry, enabled: boolean) => {
    setPaymentFeedback('');
    setPaymentError('');
    updatePaymentCountry.mutate(
      { countryCode: country.countryCode, data: { enabled } },
      {
        onSuccess: async (updatedCountry) => {
          setPaymentFeedback(updatedCountry.countryName);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: getListAdminPaymentCountriesQueryKey() }),
            queryClient.invalidateQueries({ queryKey: getListPaymentCountriesQueryKey() }),
          ]);
        },
        onError: () => setPaymentError('تعذّر حفظ إعداد الدولة. لم يتغير الإعداد؛ حاول مرة أخرى.'),
      },
    );
  };

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    setLoginError('');
    login.mutate({ data: { password } }, {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetAdminSessionQueryKey() }),
          queryClient.removeQueries({ queryKey: getListPendingBarbersQueryKey() }),
          queryClient.removeQueries({ queryKey: getListBarbersQueryKey() }),
        ]);
      },
      onError: () => setLoginError('تعذّر تسجيل الدخول. راجع كلمة المرور وحاول مجددًا.'),
    });
  };

  const signOut = () => {
    logout.mutate(undefined, {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetAdminSessionQueryKey() }),
          queryClient.removeQueries({ queryKey: getListPendingBarbersQueryKey() }),
          queryClient.removeQueries({ queryKey: getListBarbersQueryKey() }),
        ]);
      },
      onError: () => setDecisionError('لم يتم تسجيل الخروج. يرجى المحاولة مرة أخرى.'),
    });
  };

  const decide = (barberId: number, status: 'active' | 'rejected') => {
    setDecisionError('');
    setBusyBarber(barberId);
    moderate.mutate({ barberId, data: { status } }, {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getListPendingBarbersQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getListBarbersQueryKey() }),
        ]);
        setBusyBarber(null);
      },
      onError: () => {
        setBusyBarber(null);
        setDecisionError('تعذّر حفظ القرار. بقي الملف في قائمة المراجعة؛ حاول مرة أخرى.');
      },
    });
  };

  const issueCode = (barberId: number) => {
    setAccessCodeError('');
    setIssuedAccessCode(null);
    issueAccessCode.mutate({ barberId }, {
      onSuccess: (result) => setIssuedAccessCode(result),
      onError: () => setAccessCodeError('تعذّر إصدار الرمز. تأكد من أن الملف نشط ثم حاول مجددًا.'),
    });
  };

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Brand />
        <div className="admin-topbar-side">
          <span className="admin-team"><span className="team-dot" /> مساحة الفريق</span>
          {authenticated && (
            <button className="admin-logout" type="button" onClick={signOut} disabled={logout.isPending} data-testid="button-admin-logout">
              <LogOut size={16} /> {logout.isPending ? 'جارٍ الخروج…' : 'تسجيل الخروج'}
            </button>
          )}
        </div>
      </header>

      <main className="admin-main">
        {session.isLoading ? (
          <div className="admin-loading" aria-label="جارٍ التحقق من الجلسة">
            <div className="admin-loading-head"><span /><span /></div>
            <div className="admin-skeleton" />
            <div className="admin-skeleton" />
          </div>
        ) : session.isError ? (
          <section className="admin-login-panel">
            <div className="admin-login-icon"><Shield aria-hidden="true" /></div>
            <div className="admin-kicker">BarberLink · مساحة الفريق</div>
            <h1>تعذّر التحقق من الجلسة</h1>
            <p>تحقق من اتصال الخدمة ثم أعد المحاولة. لن نعرض ملفات المراجعة قبل تأكيد صلاحية الدخول.</p>
            <button className="admin-primary-button" type="button" onClick={() => void session.refetch()} data-testid="button-admin-session-retry">
              <RefreshCw size={17} /> إعادة المحاولة
            </button>
          </section>
        ) : !authenticated ? (
          <section className="admin-login-panel">
            <div className="admin-login-icon"><LockKeyhole aria-hidden="true" /></div>
            <div className="admin-kicker">BarberLink · مساحة الفريق</div>
            <h1>مراجعة هادئة،<br /><em>بداية موثوقة.</em></h1>
            <p>ادخل إلى قائمة الحلاقين المستقلين الذين ينتظرون التحقق قبل ظهورهم للعملاء.</p>
            {loginError && <div className="admin-alert" role="alert"><AlertCircle size={17} />{loginError}</div>}
            <form className="admin-login-form" onSubmit={submitLogin} data-testid="form-admin-login">
              <label htmlFor="admin-password">كلمة مرور الفريق</label>
              <div className="admin-password-wrap">
                <input id="admin-password" name="password" type={passwordVisible ? 'text' : 'password'} required autoComplete="current-password" maxLength={512} placeholder="أدخل كلمة المرور" data-testid="input-admin-password" />
                <button type="button" onClick={() => setPasswordVisible((visible) => !visible)} aria-label={passwordVisible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}>
                  {passwordVisible ? 'إخفاء' : 'إظهار'}
                </button>
              </div>
              <button className="admin-primary-button" type="submit" disabled={login.isPending} data-testid="button-admin-login">
                {login.isPending ? 'جارٍ التحقق…' : <>دخول آمن <ArrowLeft size={17} /></>}
              </button>
            </form>
            <div className="admin-login-foot"><Shield size={14} /> دخول خاص بفريق المراجعة</div>
          </section>
        ) : (
          <>
            <div className="admin-heading">
              <div>
                <div className="admin-kicker">لوحة المراجعة <span>·</span> الفريق المحلي</div>
                <h1>ملفات تنتظر<br className="mobile-break" /> <em>عينك الخبيرة.</em></h1>
                <p>تحقق من تفاصيل كل محترف، ثم قرر إن كان جاهزًا للظهور في دليل الحلاقين.</p>
              </div>
              <div className="admin-count-card">
                <span className="count-label">قيد المراجعة</span>
                <strong>{pending.isLoading ? '—' : (pending.data?.length ?? 0).toLocaleString(getLocale() === 'ar' ? 'ar' : 'fr-FR')}</strong>
                <span className="count-note"><span className="team-dot" /> طلبات جديدة</span>
              </div>
            </div>
            <section className="payment-admin-section" aria-labelledby="payment-country-heading">
              <div className="payment-admin-heading">
                <div>
                  <div className="admin-kicker">تهيئة مستقبلية</div>
                  <h2 id="payment-country-heading">إعداد الدفع حسب الدولة</h2>
                  <p>هذا التبديل يحفظ تفضيل الإعداد فقط. لا ينشئ صفحة دفع ولا يعني أن التحصيل متاح.</p>
                </div>
                <CreditCard aria-hidden="true" />
              </div>
              {paymentFeedback && <div className="payment-feedback" role="status" data-testid="status-payment-country-feedback"><Check size={16} />{paymentFeedback}: {getLocale() === 'ar' ? 'تم حفظ تفضيل الإعداد. لم يتم تفعيل تحصيل المدفوعات.' : 'Payment preference saved. Payment collection has not been enabled.'}</div>}
              {paymentError && <div className="admin-alert admin-alert-wide" role="alert" data-testid="status-payment-country-error"><AlertCircle size={17} />{paymentError}</div>}
              {paymentCountries.isLoading ? (
                <div className="payment-country-skeleton" aria-label="جارٍ تحميل إعدادات الدول"><span /><span /></div>
              ) : paymentCountries.isError ? (
                <div className="payment-country-error" role="alert">
                  <span>تعذّر تحميل إعدادات الدفع للدول.</span>
                  <button className="admin-secondary-button" type="button" onClick={() => void paymentCountries.refetch()} data-testid="button-payment-countries-retry"><RefreshCw size={15} /> إعادة المحاولة</button>
                </div>
              ) : (
                <div className="payment-country-list" data-testid="list-admin-payment-countries">
                  {(paymentCountries.data ?? []).length === 0 ? (
                    <div className="payment-country-empty" role="status">لا توجد دول متاحة لإعداد الدفع حاليًا.</div>
                  ) : (paymentCountries.data ?? []).map((country) => (
                    <article className="payment-country-row" key={country.countryCode} data-testid={`card-payment-country-${country.countryCode}`}>
                      <div className="payment-country-copy">
                        <strong>{country.countryName}</strong>
                        <span>{country.countryCode} · {country.currency}</span>
                      </div>
                      <div className="payment-readiness">
                        <span className={country.providerReady ? 'readiness-ready' : 'readiness-pending'}>
                          {country.providerReady ? 'مزود الدفع جاهز' : 'مزود الدفع غير مهيأ'}
                        </span>
                        <small>{country.acceptingPayments ? 'استقبال المدفوعات مفعّل' : 'لا يتم استقبال مدفوعات'}</small>
                      </div>
                      <label className="payment-toggle">
                        <input
                          type="checkbox"
                          checked={country.enabled}
                          disabled={updatePaymentCountry.isPending}
                          onChange={(event) => savePaymentPreference(country, event.target.checked)}
                          aria-label={`${country.enabled ? 'تعطيل' : 'تفعيل'} تفضيل الدفع في ${country.countryName}`}
                          data-testid={`toggle-payment-country-${country.countryCode}`}
                        />
                        <span aria-hidden="true" />
                        <b>{country.enabled ? 'الإعداد مفعّل' : 'الإعداد متوقف'}</b>
                      </label>
                    </article>
                  ))}
                </div>
              )}
              <div className="payment-admin-disclaimer" role="note">
                <ShieldCheck aria-hidden="true" />
                <span>جاهزية مزود الدفع غير متوفرة حاليًا. تفعيل الإعداد لا يجعل الدفع مباشرًا، ولا يتم تحصيل أي مبلغ من العملاء.</span>
              </div>
            </section>
            <div className="review-toolbar">
              <div className="review-toolbar-title"><span className="review-number">01</span><strong>قائمة الملفات</strong><span className="review-divider" /> مراجعة كل ملف على حدة</div>
              <div className="admin-live"><span /> بيانات مباشرة</div>
            </div>
            {decisionError && <div className="admin-alert admin-alert-wide" role="alert"><AlertCircle size={17} />{decisionError}</div>}
            {pending.isLoading ? (
              <div className="review-skeletons" aria-label="جارٍ تحميل طلبات المراجعة">
                {[0, 1].map((item) => <div className="review-skeleton" key={item}><span /><div><i /><i /><i /></div></div>)}
              </div>
            ) : pending.isError ? (
              <div className="admin-state admin-error-state" role="alert">
                <div className="state-symbol"><AlertCircle /></div>
                <h2>لم نتمكن من تحميل الملفات</h2>
                <p>قد تكون الجلسة انتهت أو الاتصال غير مستقر. أعد المحاولة للمتابعة.</p>
                <button className="admin-secondary-button" type="button" onClick={() => void pending.refetch()} data-testid="button-pending-retry"><RefreshCw size={16} /> إعادة تحميل القائمة</button>
              </div>
            ) : (pending.data ?? []).length === 0 ? (
              <div className="admin-state admin-empty-state" data-testid="status-admin-empty">
                <div className="empty-orbit"><UserRoundCheck /></div>
                <div className="admin-kicker">كل شيء في مكانه</div>
                <h2>لا توجد ملفات معلّقة.</h2>
                <p>حين يرسل حلاق مستقل ملفه، سيظهر هنا لتراجعه قبل نشره للعملاء.</p>
                <Link href="/discover" className="admin-back-link">العودة إلى الاكتشاف <ArrowLeft size={15} /></Link>
              </div>
            ) : (
              <div className="review-list" data-testid="list-pending-barbers">
                {(pending.data ?? []).map((barber) => (
                  <ReviewCard
                    key={barber.id}
                    barber={barber}
                    isBusy={busyBarber === barber.id}
                    onDecision={(status) => decide(barber.id, status)}
                  />
                ))}
              </div>
            )}
            <section className="active-barber-access" aria-labelledby="active-barber-heading">
              <div className="review-toolbar">
                <div className="review-toolbar-title"><span className="review-number">02</span><strong id="active-barber-heading">رموز دخول الحلاقين الحاليين</strong></div>
                <div className="admin-live"><span /> للملفات النشطة</div>
              </div>
              <p>أصدر رمزًا للحلاقين المسجلين قبل تفعيل لوحة الطلبات، ثم أرسله لهم يدويًا. إصدار رمز جديد يعطّل الرمز السابق.</p>
              {accessCodeError && <div className="admin-alert admin-alert-wide" role="alert"><AlertCircle size={17} />{accessCodeError}</div>}
              {issuedAccessCode && (
                <div className="issued-access-code" role="status" data-testid="status-issued-access-code">
                  <strong>رمز الدخول للحلاق #{issuedAccessCode.barberId}</strong>
                  <code>{issuedAccessCode.accessCode}</code>
                  <span>انسخه وأرسله للحلاق الآن؛ لن يظهر مرة أخرى.</span>
                </div>
              )}
              {activeBarbers.isLoading ? (
                <div className="admin-skeleton" />
              ) : activeBarbers.isError ? (
                <div className="admin-alert" role="alert"><AlertCircle size={17} />تعذّر تحميل الحلاقين الحاليين.</div>
              ) : (
                <div className="active-barber-list">
                  {(activeBarbers.data ?? []).filter((barber) => barber.status === 'active').map((barber) => (
                    <div className="active-barber-row" key={barber.id}>
                      <span><strong>{barber.name}</strong><small>حلاق #{barber.id}</small></span>
                      <button
                        className="admin-secondary-button"
                        type="button"
                        disabled={issueAccessCode.isPending}
                        onClick={() => issueCode(barber.id)}
                        data-testid={`button-issue-access-code-${barber.id}`}
                      >
                        {issueAccessCode.isPending ? 'جارٍ الإصدار…' : 'إصدار رمز الدخول'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <footer className="admin-footer"><span>BarberLink</span><span>نراجع اليوم، لنطمئن غدًا.</span><span>فريق المراجعة <span className="team-dot" /></span></footer>
          </>
        )}
      </main>
    </div>
  );
}

function ReviewCard({ barber, isBusy, onDecision }: { barber: BarberReview; isBusy: boolean; onDecision: (status: 'active' | 'rejected') => void }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <article className={`review-card${isBusy ? ' is-busy' : ''}${expanded ? '' : ' is-collapsed'}`} data-testid={`review-card-${barber.id}`}>
      <div className="review-card-top">
        <div className="review-identity">
          <div className="review-avatar">
            {barber.imageUrl ? <img src={barber.imageUrl} alt={`صورة ${barber.name}`} /> : <span>{barber.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('')}</span>}
          </div>
          <div>
            <div className="review-meta-line"><span className="pending-pill"><span /> ينتظر المراجعة</span><span className="review-id">طلب #{barber.id}</span></div>
            <h2>{barber.name}</h2>
            <div className="review-location"><MapPin size={14} /> {barber.city}<span className="location-separator">/</span>{barber.areas.join('، ')}</div>
          </div>
        </div>
        <div className="review-date"><CalendarClock size={15} /><span>وصل في<br /><strong>{dateLabel(barber.createdAt)}</strong></span></div>
      </div>
      <div className="review-details">
        <div className="review-bio"><span className="detail-label">نبذة عن الحلاق</span><p>{barber.bio}</p></div>
        <div className="review-contact"><span className="detail-label">التواصل</span><a href={`tel:${barber.phone}`}><Phone size={14} /> {barber.phone}</a></div>
        <div className="review-service-section">
          <span className="detail-label">الخدمات والأسعار</span>
          <div className="review-services">
            {barber.services.map((service) => (
              <div className="review-service" key={service.id}>
                <span><strong>{service.name}</strong><small><Clock3 size={12} /> {service.durationMinutes} دقيقة</small></span>
                <b>{money(service.price, barber.currency)}</b>
              </div>
            ))}
          </div>
          <div className="review-travel"><span>رسوم التنقل</span><strong>{money(barber.travelFee, barber.currency)}</strong></div>
        </div>
      </div>
      <div className="review-card-bottom">
        <button className="review-disclosure" type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
          {expanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'} <ChevronDown size={15} />
        </button>
        <div className="review-actions">
          <button className="reject-button" type="button" disabled={isBusy} onClick={() => onDecision('rejected')} data-testid={`button-reject-${barber.id}`}>
            <UserRoundX size={16} /> {isBusy ? 'جارٍ الحفظ…' : 'رفض الملف'}
          </button>
          <button className="approve-button" type="button" disabled={isBusy} onClick={() => onDecision('active')} data-testid={`button-approve-${barber.id}`}>
            <UserRoundCheck size={16} /> {isBusy ? 'جارٍ الحفظ…' : 'اعتماد ونشر'}
          </button>
        </div>
      </div>
    </article>
  );
}

type BookingReference = { id: number; token: string };

function readCustomerBookings(): BookingReference[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem('barberlink_customer_bookings') || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is BookingReference =>
      item !== null &&
      typeof item === 'object' &&
      Number.isInteger((item as BookingReference).id) &&
      typeof (item as BookingReference).token === 'string',
    );
  } catch {
    return [];
  }
}

function bookingStatusLabel(status: string) {
  if (status === 'confirmed') return 'تم تأكيد الموعد';
  if (status === 'unavailable') return 'لم نعثر على حلاق متاح';
  return 'بانتظار رد الحلاق';
}

function CustomerBookings() {
  const [references, setReferences] = useState<BookingReference[]>([]);
  useEffect(() => setReferences(readCustomerBookings()), []);

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="page-wrap">
        <div className="page-heading">
          <div className="section-label">حجوزاتك</div>
          <h1>تابع حالة<br />طلبات مواعيدك.</h1>
          <p>تتحدث الحالات تلقائيًا عند رد الحلاق. هذه القائمة محفوظة على هذا الجهاز.</p>
        </div>
        {references.length === 0 ? (
          <div className="tracking-empty" data-testid="status-no-customer-bookings">
            <CalendarDays aria-hidden="true" />
            <h2>لا توجد طلبات محفوظة هنا</h2>
            <p>بعد إرسال طلب موعد من هذا الجهاز، ستتمكن من متابعة رده في هذه الصفحة.</p>
            <Link href="/discover" className="submit-button">اكتشف الحلاقين</Link>
          </div>
        ) : (
          <div className="tracking-list" data-testid="list-customer-bookings">
            {references.map((reference) => <CustomerBookingCard key={reference.id} reference={reference} />)}
          </div>
        )}
      </main>
    </div>
  );
}

function CustomerBookingCard({ reference }: { reference: BookingReference }) {
  const params = { bookingId: reference.id, token: reference.token };
  const query = useGetBookingStatus(params, {
    query: {
      queryKey: getGetBookingStatusQueryKey(params),
      refetchInterval: 10000,
      retry: false,
    },
  });
  const booking = query.data as BookingTracking | undefined;
  return (
    <article className="tracking-card" data-testid={`tracking-card-${reference.id}`}>
        <div className={`tracking-status ${booking?.status ?? 'requested'}`}>
          {query.isLoading
            ? 'جارٍ تحميل الحالة…'
            : query.isError
              ? 'تعذّر تحميل الحالة'
              : booking?.status === 'requested' && booking.attemptCount > 1
                ? 'أرسلنا الطلب إلى حلاق بديل'
                : bookingStatusLabel(booking?.status ?? 'requested')}
      </div>
      {booking ? (
        <div className="tracking-details">
          <strong>{booking.barberName ?? 'لا يوجد حلاق متاح حاليًا'}</strong>
          <span>{booking.serviceName}</span>
          <span>{dateLabel(booking.date)} · {booking.time}</span>
          {booking.status === 'requested' && (
            <small>
              {booking.attemptCount > 1
                ? booking.lastAttemptReason === 'rejected'
                  ? 'اعتذر الحلاق السابق؛ أرسلنا الطلب إلى حلاق بديل.'
                  : 'لم يصل رد من الحلاق السابق؛ أرسلنا الطلب إلى حلاق بديل.'
                : 'إذا لم يصل رد خلال دقيقة، سنحاول مع حلاق آخر تلقائيًا.'}
            </small>
          )}
          {booking.status === 'unavailable' && (
            <small>
              {booking.lastAttemptReason === 'rejected'
                ? 'اعتذر الحلاقون الذين استلموا الطلب أو لم يتوفر بديل يغطي المنطقة. يمكنك تعديل المنطقة وإرسال طلب جديد.'
                : 'لم يرد الحلاقون المتاحون أو لم نجد بديلًا يغطي المنطقة. يمكنك تعديل المنطقة وإرسال طلب جديد.'}
            </small>
          )}
          <small>عدد محاولات الإرسال: {booking.attemptCount.toLocaleString(getLocale() === 'ar' ? 'ar' : 'fr-FR')}</small>
          <small>رقم الطلب #{booking.id}</small>
        </div>
      ) : (
        <div className="tracking-details">
          <strong>طلب موعد #{reference.id}</strong>
          <span>{query.isError ? 'تحقق من اتصالك ثم أعد تحميل الصفحة.' : 'نحدّث بيانات الطلب.'}</span>
        </div>
      )}
      {query.isError && <button className="admin-secondary-button" type="button" onClick={() => void query.refetch()}><RefreshCw size={15} /> إعادة المحاولة</button>}
    </article>
  );
}

function BarberPortal() {
  const queryClient = useQueryClient();
  const session = useGetBarberSession({
    query: { queryKey: getGetBarberSessionQueryKey(), retry: false, staleTime: 0 },
  });
  const authenticated = session.data?.authenticated === true;
  const bookings = useListBarberBookings({
    query: {
      queryKey: getListBarberBookingsQueryKey(),
      enabled: authenticated,
      retry: false,
      refetchInterval: 15000,
    },
  });
  const login = useLoginBarber();
  const emailLogin = useLoginBarberByEmail();
  const recoverPassword = useRecoverBarberPassword();
  const logout = useLogoutBarber();
  const decideBooking = useDecideBarberBooking();
  const updateAvailability = useUpdateBarberAvailability();
  const [loginMode, setLoginMode] = useState<'email' | 'legacy' | 'recover'>('email');
  const [loginError, setLoginError] = useState('');
  const [recoveryResult, setRecoveryResult] = useState<{ barberId: number; email: string; accessCode: string } | null>(null);
  const [decisionError, setDecisionError] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');
  const [busyBooking, setBusyBooking] = useState<number | null>(null);

  const refreshBarberSession = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetBarberSessionQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getListBarberBookingsQueryKey() }),
    ]);
  };

  const submitEmailLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoginError('');
    emailLogin.mutate({
      data: {
        email: String(form.get('email') || '').trim().toLowerCase(),
        password: String(form.get('password') || ''),
      },
    }, {
      onSuccess: refreshBarberSession,
      onError: () => setLoginError('البريد الإلكتروني أو كلمة المرور غير صحيحة.'),
    });
  };

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoginError('');
    login.mutate({
      data: {
        barberId: Number(form.get('barberId')),
        accessCode: String(form.get('accessCode') || '').trim(),
      },
    }, {
      onSuccess: refreshBarberSession,
      onError: () => setLoginError('رقم الحلاق أو رمز الدخول غير صحيح.'),
    });
  };

  const submitRecovery = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    if (password !== String(form.get('passwordConfirm') || '')) {
      setLoginError('كلمتا المرور غير متطابقتين.');
      return;
    }

    setLoginError('');
    setRecoveryResult(null);
    recoverPassword.mutate({
      data: {
        barberId: Number(form.get('barberId')),
        accessCode: String(form.get('accessCode') || '').trim(),
        email: String(form.get('email') || '').trim().toLowerCase(),
        password,
      },
    }, {
      onSuccess: (result) => setRecoveryResult(result),
      onError: () => setLoginError('تعذّر تحديث الحساب. تحقق من رقم الملف والرمز، وأن البريد غير مستخدم بحساب آخر.'),
    });
  };

  const signOut = () => {
    logout.mutate(undefined, {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetBarberSessionQueryKey() }),
          queryClient.removeQueries({ queryKey: getListBarberBookingsQueryKey() }),
        ]);
      },
    });
  };

  const saveAvailability = (isAvailable: boolean, location?: { latitude: number; longitude: number }) => {
    setAvailabilityError('');
    updateAvailability.mutate({
      data: {
        isAvailable,
        ...(location ?? {}),
      },
    }, {
      onSuccess: async (updatedSession) => {
        queryClient.setQueryData(getGetBarberSessionQueryKey(), updatedSession);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getListBarbersQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getListBarberBookingsQueryKey() }),
        ]);
      },
      onError: () => setAvailabilityError('تعذّر تحديث حالة التوفر. تحقق من الاتصال وحاول مجددًا.'),
    });
  };

  const shareBarberLocation = () => {
    setAvailabilityError('');
    if (!navigator.geolocation) {
      setAvailabilityError('المتصفح لا يدعم تحديد الموقع. يمكنك استقبال الطلبات حسب نطاق الأحياء المسجل.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        saveAvailability(session.data?.isAvailable === true, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => setAvailabilityError('لم نتمكن من الوصول إلى موقعك. يمكنك تشغيل التوفر دون مشاركة الموقع.'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  const decide = (bookingId: number, status: 'confirmed' | 'rejected') => {
    setDecisionError('');
    setBusyBooking(bookingId);
    decideBooking.mutate({ bookingId, data: { status } }, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getListBarberBookingsQueryKey() });
        setBusyBooking(null);
      },
      onError: () => {
        setBusyBooking(null);
        setDecisionError('تعذّر حفظ القرار. أعد تحميل القائمة وحاول مجددًا.');
      },
    });
  };

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Brand />
        <div className="admin-topbar-side">
          <Link className="admin-back-link" href="/discover">اكتشف الحلاقين</Link>
          {authenticated && (
            <button className="admin-logout" type="button" onClick={signOut} disabled={logout.isPending} data-testid="button-barber-logout">
              <LogOut size={16} /> تسجيل الخروج
            </button>
          )}
        </div>
      </header>
      <main className="admin-main">
        {session.isLoading ? (
          <div className="admin-loading" aria-label="جارٍ التحقق من الجلسة"><div className="admin-skeleton" /></div>
        ) : !authenticated ? (
          <section className="admin-login-panel">
            <div className="admin-login-icon"><Scissors aria-hidden="true" /></div>
            <div className="admin-kicker">BarberLink · مساحة الحلاق</div>
            <h1>طلباتك،<br /><em>في مكان واحد.</em></h1>
            <p>{loginMode === 'recover' ? 'استخدم رقم الملف ورمز الاسترداد لتعيين بريد وكلمة مرور جديدين.' : 'سجّل الدخول ببريدك وكلمة المرور، أو استخدم بيانات الملف للحسابات القديمة.'}</p>
            {loginError && <div className="admin-alert" role="alert"><AlertCircle size={17} />{loginError}</div>}
            {loginMode !== 'recover' && (
              <div className="barber-login-tabs" role="group" aria-label="طريقة دخول الحلاق">
                <button type="button" aria-pressed={loginMode === 'email'} onClick={() => { setLoginMode('email'); setLoginError(''); }}>البريد وكلمة المرور</button>
                <button type="button" aria-pressed={loginMode === 'legacy'} onClick={() => { setLoginMode('legacy'); setLoginError(''); }}>رقم الملف والرمز</button>
              </div>
            )}
            {loginMode === 'email' && (
              <>
                <form className="admin-login-form" onSubmit={submitEmailLogin} data-testid="form-barber-email-login">
                  <label htmlFor="barber-login-email">البريد الإلكتروني</label>
                  <input id="barber-login-email" name="email" type="email" autoComplete="email" required maxLength={254} data-testid="input-barber-login-email" />
                  <label htmlFor="barber-login-password">كلمة المرور</label>
                  <input id="barber-login-password" name="password" type="password" autoComplete="current-password" required minLength={12} maxLength={128} data-testid="input-barber-login-password" />
                  <button className="admin-primary-button" type="submit" disabled={emailLogin.isPending} data-testid="button-barber-email-login">
                    {emailLogin.isPending ? 'جارٍ التحقق…' : <>دخول إلى الطلبات <ArrowLeft size={17} /></>}
                  </button>
                </form>
                <button className="barber-login-link" type="button" onClick={() => { setLoginMode('recover'); setLoginError(''); setRecoveryResult(null); }}>
                  نسيت كلمة المرور أو تريد تفعيل بريد لحساب قديم؟
                </button>
              </>
            )}
            {loginMode === 'legacy' && (
              <>
                <form className="admin-login-form" onSubmit={submitLogin} data-testid="form-barber-login">
                  <label htmlFor="barber-account-id">رقم الحلاق</label>
                  <input id="barber-account-id" name="barberId" type="number" min="1" autoComplete="username" required data-testid="input-barber-id" />
                  <label htmlFor="barber-access-code">رمز الدخول</label>
                  <input id="barber-access-code" name="accessCode" type="password" autoComplete="current-password" minLength={32} maxLength={128} required data-testid="input-barber-access-code" />
                  <button className="admin-primary-button" type="submit" disabled={login.isPending} data-testid="button-barber-login">
                    {login.isPending ? 'جارٍ التحقق…' : <>دخول إلى الطلبات <ArrowLeft size={17} /></>}
                  </button>
                </form>
                <button className="barber-login-link" type="button" onClick={() => { setLoginMode('recover'); setLoginError(''); setRecoveryResult(null); }}>
                  تعيين بريد وكلمة مرور أو استعادة كلمة المرور
                </button>
              </>
            )}
            {loginMode === 'recover' && recoveryResult ? (
              <div className="barber-recovery-result" data-testid="status-barber-password-recovered">
                <strong>تم تحديث بيانات الدخول</strong>
                <span>استخدم البريد الجديد وكلمة المرور لتسجيل الدخول. احفظ رمز الاسترداد الجديد؛ الرمز السابق لم يعد صالحًا.</span>
                <code>{recoveryResult.accessCode}</code>
                <button className="admin-secondary-button" type="button" onClick={() => { setLoginMode('email'); setRecoveryResult(null); setLoginError(''); }}>العودة إلى تسجيل الدخول</button>
              </div>
            ) : loginMode === 'recover' ? (
              <>
                <form className="admin-login-form" onSubmit={submitRecovery} data-testid="form-barber-password-recovery">
                  <label htmlFor="recovery-barber-id">رقم الحلاق</label>
                  <input id="recovery-barber-id" name="barberId" type="number" min="1" required data-testid="input-recovery-barber-id" />
                  <label htmlFor="recovery-access-code">رمز الاسترداد</label>
                  <input id="recovery-access-code" name="accessCode" type="password" minLength={32} maxLength={128} required data-testid="input-recovery-access-code" />
                  <label htmlFor="recovery-email">البريد الإلكتروني الجديد أو الحالي</label>
                  <input id="recovery-email" name="email" type="email" maxLength={254} required autoComplete="email" data-testid="input-recovery-email" />
                  <label htmlFor="recovery-password">كلمة المرور الجديدة</label>
                  <input id="recovery-password" name="password" type="password" minLength={12} maxLength={128} required autoComplete="new-password" data-testid="input-recovery-password" />
                  <label htmlFor="recovery-password-confirm">تأكيد كلمة المرور</label>
                  <input id="recovery-password-confirm" name="passwordConfirm" type="password" minLength={12} maxLength={128} required autoComplete="new-password" data-testid="input-recovery-password-confirm" />
                  <button className="admin-primary-button" type="submit" disabled={recoverPassword.isPending} data-testid="button-barber-password-recovery">
                    {recoverPassword.isPending ? 'جارٍ تحديث الحساب…' : <>تحديث البريد وكلمة المرور <ArrowLeft size={17} /></>}
                  </button>
                </form>
                <p className="barber-recovery-note">لا نرسل رسالة تحقق حاليًا. أدخل بريدًا تملكه واحفظ رمز الاسترداد الجديد بعد التحديث.</p>
                <button className="barber-login-link" type="button" onClick={() => { setLoginMode('email'); setLoginError(''); }}>العودة إلى تسجيل الدخول</button>
              </>
            ) : null}
            <div className="admin-login-foot"><Shield size={14} /> لا يمكن للحلاق الاطلاع إلا على طلباته</div>
          </section>
        ) : (
          <>
            <div className="admin-heading">
              <div>
                <div className="admin-kicker">مساحة الحلاق <span>·</span> {session.data?.barberName}</div>
                <h1>طلبات مواعيدك<br /><em>تنتظر قرارك.</em></h1>
                <p>راجع تفاصيل كل طلب، ثم أكّد الموعد أو ارفضه. سيظهر قرارك للعميل.</p>
              </div>
              <div className="admin-count-card">
                <span className="count-label">بانتظار ردك</span>
                <strong>{(bookings.data ?? []).filter((booking) => booking.status === 'requested').length.toLocaleString(getLocale() === 'ar' ? 'ar' : 'fr-FR')}</strong>
                <span className="count-note"><span className="team-dot" /> طلبات واردة</span>
              </div>
            </div>
            <section className="barber-availability-panel" aria-label="إعدادات استقبال الطلبات">
              <div>
                <strong>{session.data?.isAvailable ? 'متاح لاستقبال الطلبات' : 'متوقف عن استقبال الطلبات'}</strong>
                <p>{session.data?.hasLocation ? 'سيظهر موقعك الدقيق للمنظومة فقط لاختيار الأقرب.' : 'يمكنك استقبال الطلبات حسب نطاق الأحياء المسجل في ملفك.'}</p>
              </div>
              <div className="availability-actions">
                <button
                  className={`availability-toggle ${session.data?.isAvailable ? 'enabled' : ''}`}
                  type="button"
                  aria-pressed={session.data?.isAvailable === true}
                  disabled={updateAvailability.isPending}
                  onClick={() => saveAvailability(session.data?.isAvailable !== true)}
                  data-testid="button-toggle-barber-availability"
                >
                  {updateAvailability.isPending ? 'جارٍ الحفظ…' : session.data?.isAvailable ? 'إيقاف التوفر' : 'تشغيل التوفر'}
                </button>
                <button
                  className="admin-secondary-button"
                  type="button"
                  disabled={updateAvailability.isPending}
                  onClick={shareBarberLocation}
                  data-testid="button-share-barber-location"
                >
                  <MapPin size={15} /> {session.data?.hasLocation ? 'تحديث موقعي' : 'مشاركة موقعي لتحديد الأقرب'}
                </button>
              </div>
              {availabilityError && <p className="availability-error" role="alert">{availabilityError}</p>}
            </section>
            {decisionError && <div className="admin-alert admin-alert-wide" role="alert"><AlertCircle size={17} />{decisionError}</div>}
            {bookings.isLoading ? (
              <div className="review-skeletons" aria-label="جارٍ تحميل الطلبات"><div className="review-skeleton" /><div className="review-skeleton" /></div>
            ) : bookings.isError ? (
              <div className="admin-state admin-error-state" role="alert">
                <div className="state-symbol"><AlertCircle /></div>
                <h2>لم نتمكن من تحميل طلباتك</h2>
                <p>قد تكون جلستك انتهت. سجّل الدخول مجددًا أو أعد تحميل القائمة.</p>
                <button className="admin-secondary-button" type="button" onClick={() => void bookings.refetch()}><RefreshCw size={16} /> إعادة المحاولة</button>
              </div>
            ) : (bookings.data ?? []).length === 0 ? (
              <div className="admin-state admin-empty-state" data-testid="status-barber-bookings-empty">
                <div className="empty-orbit"><CalendarDays /></div>
                <h2>لا توجد طلبات بعد</h2>
                <p>ستظهر هنا طلبات العملاء المرسلة إلى ملفك، ولن تظهر طلبات الحلاقين الآخرين.</p>
              </div>
            ) : (
              <div className="review-list" data-testid="list-barber-bookings">
                {(bookings.data ?? []).map((booking) => (
                  <BarberBookingCard
                    key={booking.id}
                    booking={booking}
                    isBusy={busyBooking === booking.id}
                    onDecision={(status) => decide(booking.id, status)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function BarberBookingCard({ booking, isBusy, onDecision }: {
  booking: BarberBooking;
  isBusy: boolean;
  onDecision: (status: 'confirmed' | 'rejected') => void;
}) {
  return (
    <article className={`review-card barber-booking-card${isBusy ? ' is-busy' : ''}`} data-testid={`barber-booking-${booking.id}`}>
      <div className="review-card-top">
        <div className="review-identity">
          <div className="review-avatar"><CalendarDays /></div>
          <div>
            <div className="review-meta-line">
              <span className={`pending-pill booking-pill-${booking.status}`}><span />{bookingStatusLabel(booking.status)}</span>
              <span className="review-id">طلب #{booking.id}</span>
            </div>
            <h2>{booking.customerName}</h2>
            <div className="review-location"><CalendarClock size={14} /> {dateLabel(booking.date)} · {booking.time}</div>
          </div>
        </div>
        <div className="review-date"><strong>{money(booking.servicePrice, booking.currency)}</strong></div>
      </div>
      <div className="booking-customer-details">
        <div><span className="detail-label">الخدمة</span><strong>{booking.serviceName}</strong></div>
        <div><span className="detail-label">رقم العميل</span><a href={`tel:${booking.customerPhone}`} dir="ltr"><Phone size={14} /> {booking.customerPhone}</a></div>
        <div><span className="detail-label">المنطقة</span><strong>{booking.area}</strong></div>
        {booking.note && <div className="booking-note"><span className="detail-label">ملاحظة العميل</span><p>{booking.note}</p></div>}
      </div>
      {booking.status === 'requested' && (
        <div className="review-card-bottom booking-decision-row">
          <span>اختر قرارك ليظهر للعميل</span>
          <div className="review-actions">
            <button className="reject-button" type="button" disabled={isBusy} onClick={() => onDecision('rejected')} data-testid={`button-reject-booking-${booking.id}`}>
              <UserRoundX size={16} /> رفض الطلب
            </button>
            <button className="approve-button" type="button" disabled={isBusy} onClick={() => onDecision('confirmed')} data-testid={`button-confirm-booking-${booking.id}`}>
              <UserRoundCheck size={16} /> تأكيد الموعد
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Welcome} />
        <Route path="/discover" component={Home} />
        <Route path="/join" component={Join} />
        <Route path="/admin" component={Admin} />
        <Route path="/barber" component={BarberPortal} />
        <Route path="/my-bookings" component={CustomerBookings} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  const { locale } = useLocale();
  return (
    <div className="app-locale-root" data-locale={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <QueryClientProvider client={queryClient}>
        <LanguageControl />
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
