import { type FormEvent, type ReactNode, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCreateBarber,
  useCreateBooking,
  useGetBarber,
  useHealthCheck,
  useListBarbers,
  getGetBarberQueryKey,
  getListBarbersQueryKey,
  type Barber,
  type BarberInput,
  type BookingInput,
} from '@workspace/api-client-react';
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
} from 'lucide-react';
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

function dateLabel(value: string) {
  if (!value) return '';
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
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
        <Link href="/" data-testid="link-discover">اكتشف الحلاقين</Link>
        <Link href="/join" className="nav-join" data-testid="link-join">انضم كحلاق</Link>
      </nav>
    </header>
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
    date: string;
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
      onSuccess: (result) => setConfirmation(result),
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
            <p>حُفظ طلبك. أرسل تفاصيله للحلاق عبر واتساب حتى يتمكن من تأكيد الموعد معك.</p>
            <div className="confirmation-details">
              <div>الحلاق: <strong>{confirmation.barberName}</strong></div>
              <div>الخدمة: <strong>{confirmation.serviceName}</strong></div>
              <div>التاريخ والوقت: <strong>{dateLabel(confirmation.date)}، {confirmation.time}</strong></div>
              <div>رقم الطلب: <strong>#{confirmation.id}</strong></div>
            </div>
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
  const createBarber = useCreateBarber();
  const [services, setServices] = useState<ServiceDraft[]>([{ name: '', durationMinutes: '30', price: '' }]);
  const serviceCounter = useRef(1);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState<{ id: number; message: string } | null>(null);

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
      travelFee: Number(form.get('travelFee') || 0),
      currency: String(form.get('currency') || '').trim().toUpperCase(),
      services: serviceInputs,
    };
    setFormError('');
    createBarber.mutate({ data: payload }, {
      onSuccess: (result) => setSuccess({ id: result.id, message: result.message }),
      onError: () => setFormError('لم نتمكن من إرسال ملفك. راجع الحقول وحاول مرة أخرى.'),
    });
  };

  return (
    <div className="site-shell" dir="rtl">
      <SiteHeader />
      <main className="page-wrap">
        <div className="page-heading">
          <div className="section-label">للمحترفين المستقلين</div>
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
            <Link href="/" className="submit-button" data-testid="link-join-home">العودة إلى اكتشاف الحلاقين</Link>
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
          <Link href="/" data-testid="link-join-footer-home"><ArrowRight size={14} /> العودة للاكتشاف</Link>
        </footer>
      </main>
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/join" component={Join} />
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
