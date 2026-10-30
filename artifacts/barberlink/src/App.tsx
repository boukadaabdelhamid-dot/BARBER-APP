import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  useCreateBarber,
  useCreateBooking,
  useDecideBarberBooking,
  useGetBarber,
  useGetBarberSession,
  useGetBookingStatus,
  useGetAdminSession,
  useHealthCheck,
  useListBarbers,
  useListBarberBookings,
  useListPendingBarbers,
  useLoginAdmin,
  useLoginBarber,
  useLoginBarberByEmail,
  useRecoverBarberPassword,
  useIssueBarberAccessCode,
  useLogoutAdmin,
  useLogoutBarber,
  useModerateBarber,
  getGetBarberQueryKey,
  getGetBarberSessionQueryKey,
  getGetBookingStatusQueryKey,
  getGetAdminSessionQueryKey,
  getListBarbersQueryKey,
  getListBarberBookingsQueryKey,
  getListPendingBarbersQueryKey,
  type Barber,
  type BarberReview,
  type BarberInput,
  type BookingInput,
  type BookingTracking,
  type BarberBooking,
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
} from 'lucide-react';

setBaseUrl(import.meta.env.VITE_API_BASE_URL || null);
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('ar', {
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
  return new Intl.DateTimeFormat('ar', { dateStyle: 'long' }).format(date);
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
  return (
    <header className="topbar" dir="rtl">
      <Brand />
      <nav className="nav-links" aria-label="التنقل الرئيسي">
        <Link href="/discover" data-testid="link-discover">اكتشف الحلاقين</Link>
        <Link href="/my-bookings" data-testid="link-customer-bookings">طلباتي</Link>
        <Link href="/barber" data-testid="link-barber-portal">دخول الحلاق</Link>
        <Link href="/join" className="nav-join" data-testid="link-join">انضم كحلاق</Link>
      </nav>
    </header>
  );
}

function Welcome() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<'role' | 'barber-type'>('role');

  return (
    <div className="welcome-shell" dir="rtl">
      <header className="welcome-header">
        <Brand />
        <span className="welcome-header-note">حلاقة قريبة منك، بخطوات أسهل</span>
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
    <div className="status-banner error" role="alert" dir="rtl" data-testid="status-load-error">
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
  onProfile,
  onBook,
}: {
  barber: Barber;
  onProfile: (id: number) => void;
  onBook: (id: number) => void;
}) {
  const service = barber.services[0];
  return (
    <article className="barber-card" dir="rtl" data-testid={`card-barber-${barber.id}`}>
      <div className="barber-photo">
        <BarberImage barber={barber} />
        <span className="availability"><span /> متاح للحجز</span>
      </div>
      <div className="card-body">
        <div className="card-name-row">
          <h3 data-testid={`text-barber-name-${barber.id}`}>{barber.name}</h3>
          {barber.reviewCount > 0 && (
            <span className="rating" data-testid={`text-rating-${barber.id}`}>
              <Star aria-hidden="true" /> {barber.rating.toFixed(1)} ({barber.reviewCount})
            </span>
          )}
        </div>
        <div className="location-line"><MapPin aria-hidden="true" /> {barber.city}</div>
        <p className="card-bio">{barber.bio}</p>
        {service && (
          <div className="service-line" data-testid={`text-service-${service.id}`}>
            <span>{service.name} · {service.durationMinutes} دقيقة</span>
            <strong>{money(service.price, barber.currency)}</strong>
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
  const [searchText, setSearchText] = useState('');
  const [city, setCity] = useState('');
  const [activeBarberId, setActiveBarberId] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<'profile' | 'booking' | null>(null);
  const params = useMemo(() => ({
    ...(city.trim() ? { city: city.trim() } : {}),
    ...(searchText.trim() ? { search: searchText.trim() } : {}),
  }), [city, searchText]);
  const listQuery = useListBarbers(params, { query: { queryKey: getListBarbersQueryKey(params) } });
  const health = useHealthCheck();
  const barberQuery = useGetBarber(activeBarberId ?? 0, {
    query: {
      enabled: activeBarberId !== null,
      queryKey: getGetBarberQueryKey(activeBarberId ?? 0),
    },
  });
  const openProfile = (id: number) => { setActiveBarberId(id); setModalMode('profile'); };
  const openBooking = (id: number) => { setActiveBarberId(id); setModalMode('booking'); };
  const closeModal = () => { setModalMode(null); setActiveBarberId(null); };
  const barbers = (listQuery.data ?? []).filter((barber) => barber.status === 'active');

  return (
    <div className="site-shell" dir="rtl">
      <SiteHeader />
      <main className="page-wrap">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> حلاقة على موعدك، في مكانك</div>
            <h1 id="hero-title">الحلاقة المرتبة<br />تبدأ من باب بيتك.</h1>
            <p>تعرّف إلى حلاقين متنقلين موثوقين في منطقتك. اختر الخدمة والوقت، ودع الحلاق يأتي إليك.</p>
            <a className="hero-cta" href="#barbers" data-testid="link-browse-barbers">
              اكتشف حلاقي منطقتك <ArrowLeft aria-hidden="true" />
            </a>
          </div>
          <div className="hero-stamp" aria-label="خدمة شخصية في منطقتك">
            <span><strong>لك</strong>خدمة شخصية<br />في منطقتك</span>
          </div>
        </section>

        <section id="barbers" aria-labelledby="barbers-heading">
          <div className="intro-row">
            <div>
              <div className="section-label">اختيار محلي، خدمة شخصية</div>
              <h2 id="barbers-heading">حلاقون بالقرب منك</h2>
            </div>
            <p>محترفون مستقلون يأتون إليك أينما كنت.</p>
          </div>
          <div className="finder" role="search">
            <label className="search-control">
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
            <label className="search-control">
              <MapPin aria-hidden="true" />
              <input
                type="search"
                placeholder="المدينة"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                aria-label="فلترة حسب المدينة"
                data-testid="input-city"
              />
            </label>
            <button
              className="filter-button"
              type="button"
              onClick={() => { setSearchText(''); setCity(''); }}
              data-testid="button-clear-filters"
            >
              مسح البحث <X aria-hidden="true" />
            </button>
          </div>
          <div className="results-meta" dir="rtl">
            <span><strong>{listQuery.isLoading ? '—' : barbers.length}</strong> حلاق متاح</span>
            {health.data?.status && <span className="health-state" data-testid="status-api">الخدمة متصلة</span>}
          </div>
          {listQuery.isLoading ? (
            <LoadingCards />
          ) : listQuery.isError ? (
            <ErrorMessage onRetry={() => void listQuery.refetch()}>تعذّر تحميل الحلاقين الآن. تحقق من اتصالك ثم أعد المحاولة.</ErrorMessage>
          ) : barbers.length === 0 ? (
            <div className="empty-state" dir="rtl" data-testid="status-empty-barbers">
              <div className="empty-icon"><Scissors aria-hidden="true" /></div>
              <h3>{city || searchText ? 'لم نجد حلاقًا بهذه المواصفات' : 'لا يوجد حلاقون متاحون بعد'}</h3>
              <p>{city || searchText ? 'جرّب مدينة أخرى أو كلمات بحث مختلفة، أو امسح عوامل التصفية.' : 'نعمل على إضافة محترفين محليين. إذا كنت حلاقًا متنقلًا، أرسل ملفك للمراجعة.'}</p>
              {city || searchText ? (
                <button className="retry-button" onClick={() => { setCity(''); setSearchText(''); }} type="button" data-testid="button-empty-clear">مسح البحث</button>
              ) : (
                <Link href="/join" className="retry-button" data-testid="link-empty-join">قدّم ملفك للحلاقة المتنقلة</Link>
              )}
            </div>
          ) : (
            <div className="barber-grid" data-testid="list-barbers">
              {barbers.map((barber) => (
                <BarberCard key={barber.id} barber={barber} onProfile={openProfile} onBook={openBooking} />
              ))}
            </div>
          )}
        </section>

        <section className="trust-strip" aria-label="مزايا الخدمة" dir="rtl">
          <div className="trust-copy"><ShieldCheck aria-hidden="true" /> ملفات الحلاقين تُراجع قبل ظهورها</div>
          <div className="trust-stats">
            <span><strong>حجز مباشر</strong> بلا خطوات زائدة</span>
            <span><strong>في مكانك</strong> حسب نطاق التغطية</span>
          </div>
        </section>
        <footer className="footer" dir="rtl">
          <div className="footer-brand"><span className="brand-mark"><Scissors aria-hidden="true" /></span> BarberLink</div>
          <span>حلاقة مريحة، من أهل منطقتك.</span>
          <Link href="/join" data-testid="link-footer-join">هل أنت حلاق متنقل؟ انضم إلينا</Link>
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
}: {
  mode: 'profile' | 'booking';
  barber?: Barber;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onClose: () => void;
  onBook: () => void;
}) {
  const [confirmation, setConfirmation] = useState<{
    id: number;
    status: string;
    barberName: string;
    serviceName: string;
    date: string | Date;
    time: string;
  } | null>(null);
  const booking = useCreateBooking();
  const [formError, setFormError] = useState('');
  const [contactDetails, setContactDetails] = useState<{ name: string; phone: string; area: string } | null>(null);
  const dateInput = useRef<HTMLInputElement>(null);
  const minDate = new Date().toLocaleDateString('en-CA');
  const whatsappPhone = barber?.phone.replace(/\D/g, '') ?? '';
  const whatsappMessage = confirmation
    ? `مرحبًا ${confirmation.barberName}، أرسلت طلب الموعد رقم ${confirmation.id}.\nالخدمة: ${confirmation.serviceName}\nالتاريخ: ${dateLabel(confirmation.date)} الساعة ${confirmation.time}\nالاسم: ${contactDetails?.name ?? ''}\nهاتف التواصل: ${contactDetails?.phone ?? ''}\nالمنطقة: ${contactDetails?.area ?? ''}\nأرجو تأكيد الموعد.`
    : '';
  const saveTrackingReference = (bookingId: number, token: string) => {
    const stored = readCustomerBookings();
    const updated = [{ id: bookingId, token }, ...stored.filter((item) => item.id !== bookingId)];
    window.localStorage.setItem('barberlink_customer_bookings', JSON.stringify(updated));
  };

  const submitBooking = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!barber) return;
    const form = new FormData(event.currentTarget);
    const payload: BookingInput = {
      barberId: barber.id,
      serviceId: String(form.get('serviceId') || ''),
      customerName: String(form.get('customerName') || '').trim(),
      customerPhone: String(form.get('customerPhone') || '').trim(),
      area: String(form.get('area') || '').trim(),
      date: String(form.get('date') || ''),
      time: String(form.get('time') || ''),
      note: String(form.get('note') || '').trim() || null,
    };
    setContactDetails({
      name: payload.customerName,
      phone: payload.customerPhone,
      area: payload.area,
    });
    setFormError('');
    booking.mutate({ data: payload }, {
      onSuccess: (result) => {
        saveTrackingReference(result.id, result.trackingToken);
        setConfirmation(result);
      },
      onError: () => setFormError('تعذّر إرسال طلبك. يرجى التحقق من البيانات والمحاولة مرة أخرى.'),
    });
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} dir="rtl">
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
            <p>حُفظ طلبك. ستظهر حالة التأكيد في صفحة «طلباتي» بعد أن يراجع الحلاق الطلب.</p>
            <div className="confirmation-details">
              <div>الحلاق: <strong>{confirmation.barberName}</strong></div>
              <div>الخدمة: <strong>{confirmation.serviceName}</strong></div>
              <div>التاريخ والوقت: <strong>{dateLabel(confirmation.date)}، {confirmation.time}</strong></div>
              <div>رقم الطلب: <strong>#{confirmation.id}</strong></div>
              <div>الحالة: <strong>قيد انتظار رد الحلاق</strong></div>
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
            <h2>اطلب موعدًا مع {barber.name}</h2>
            <p>أرسل طلبك، وسيتواصل معك الحلاق لتأكيد الموعد.</p>
            <div className="booking-summary" data-testid="booking-summary">
              <span><strong>{barber.name}</strong> · {barber.city}</span>
              <span>تنقل {money(barber.travelFee, barber.currency)}</span>
            </div>
            {formError && <div className="status-banner error" role="alert"><AlertCircle />{formError}</div>}
            <div className="field">
              <label htmlFor="booking-service">الخدمة</label>
              <select id="booking-service" name="serviceId" required data-testid="select-booking-service">
                {barber.services.map((service) => <option key={service.id} value={service.id}>{service.name} · {service.durationMinutes} دقيقة · {money(service.price, barber.currency)}</option>)}
              </select>
            </div>
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
            <div className="field">
              <label htmlFor="booking-area">الحي أو المنطقة</label>
              <input id="booking-area" name="area" required minLength={2} maxLength={120} placeholder="أين ترغب باستقبال الحلاق؟" data-testid="input-booking-area" />
            </div>
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
            <button className="submit-button" type="submit" disabled={booking.isPending} data-testid="button-submit-booking">
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
      city: String(form.get('city') || '').trim(),
      areas: String(form.get('areas') || '').split(/[،,]/).map((area) => area.trim()).filter(Boolean),
      bio: String(form.get('bio') || '').trim(),
      phone: String(form.get('phone') || '').trim(),
      email: String(form.get('email') || '').trim().toLowerCase(),
      password,
      travelFee: Number(form.get('travelFee') || 0),
      currency: String(form.get('currency') || '').trim().toUpperCase(),
      services: serviceInputs,
    };
    setFormError('');
    createBarber.mutate({ data: payload }, {
      onSuccess: (result) => setSuccess({ id: result.id, message: result.message, accessCode: result.accessCode }),
      onError: () => setFormError('تعذّر إرسال الملف. تحقق من الحقول، وتأكد أن البريد غير مسجل من قبل.'),
    });
  };

  return (
    <div className="site-shell" dir="rtl">
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
            <p>{success.message || 'شكرًا لانضمامك. سيراجع فريقنا معلوماتك قبل إظهار ملفك للعملاء.'}</p>
            <div className="confirmation-details">رقم الطلب: <strong>#{success.id}</strong><br />الحالة: <strong>قيد المراجعة</strong></div>
            <div className="access-code-panel" dir="rtl">
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
                  <input id="barber-currency" name="currency" required minLength={3} maxLength={3} pattern="[A-Za-z]{3}" placeholder="مثل USD أو EUR" data-testid="input-barber-currency" />
                  <small>اكتب رمز العملة المكوّن من 3 أحرف.</small>
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
        <footer className="footer" dir="rtl">
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
  const login = useLoginAdmin();
  const logout = useLogoutAdmin();
  const moderate = useModerateBarber();
  const issueAccessCode = useIssueBarberAccessCode();
  const [loginError, setLoginError] = useState('');
  const [decisionError, setDecisionError] = useState('');
  const [busyBarber, setBusyBarber] = useState<number | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [issuedAccessCode, setIssuedAccessCode] = useState<{ barberId: number; accessCode: string } | null>(null);
  const [accessCodeError, setAccessCodeError] = useState('');

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
    <div className="admin-shell" dir="rtl">
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
                <strong>{pending.isLoading ? '—' : (pending.data?.length ?? 0).toLocaleString('ar')}</strong>
                <span className="count-note"><span className="team-dot" /> طلبات جديدة</span>
              </div>
            </div>
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
  if (status === 'rejected') return 'تعذّر قبول الموعد';
  return 'بانتظار رد الحلاق';
}

function CustomerBookings() {
  const [references, setReferences] = useState<BookingReference[]>([]);
  useEffect(() => setReferences(readCustomerBookings()), []);

  return (
    <div className="site-shell" dir="rtl">
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
        {query.isLoading ? 'جارٍ تحميل الحالة…' : query.isError ? 'تعذّر تحميل الحالة' : bookingStatusLabel(booking?.status ?? 'requested')}
      </div>
      {booking ? (
        <div className="tracking-details">
          <strong>{booking.barberName}</strong>
          <span>{booking.serviceName}</span>
          <span>{dateLabel(booking.date)} · {booking.time}</span>
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
  const [loginMode, setLoginMode] = useState<'email' | 'legacy' | 'recover'>('email');
  const [loginError, setLoginError] = useState('');
  const [recoveryResult, setRecoveryResult] = useState<{ barberId: number; email: string; accessCode: string } | null>(null);
  const [decisionError, setDecisionError] = useState('');
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
    <div className="admin-shell" dir="rtl">
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
                <strong>{(bookings.data ?? []).filter((booking) => booking.status === 'requested').length.toLocaleString('ar')}</strong>
                <span className="count-note"><span className="team-dot" /> طلبات واردة</span>
              </div>
            </div>
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
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
