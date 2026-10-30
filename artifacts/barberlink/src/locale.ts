import { createElement, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Languages } from 'lucide-react';

export type Locale = 'ar' | 'fr';
const STORAGE_KEY = 'barberlink-locale';
let activeLocale: Locale = 'ar';
const listeners = new Set<(locale: Locale) => void>();

function initialLocale(): Locale {
  if (typeof window !== 'undefined') {
    const requested = new URLSearchParams(window.location.search).get('lang');
    if (requested === 'fr') return 'fr';
    if (requested === 'ar') return 'ar';
  }
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'fr' ? 'fr' : 'ar';
  } catch {
    return 'ar';
  }
}

export const translations: Record<string, string> = {
  'التنقل الرئيسي':'Navigation principale','اكتشف الحلاقين':'Découvrir les barbiers','طلباتي':'Mes demandes','دخول الحلاق':'Espace barbier','دعم واتساب':'Assistance WhatsApp','انضم كحلاق':'Rejoindre comme barbier',
  'حلاقة قريبة منك، بخطوات أسهل':'Un barbier près de vous, en quelques étapes','واتساب الدعم':'Assistance WhatsApp','مرحبًا بك في BarberLink':'Bienvenue sur BarberLink',
  'كيف تريد استخدام التطبيق؟':'Comment souhaitez-vous utiliser l’application ?','اختر ما يناسبك لنوصلك مباشرة إلى الخطوة التالية.':'Choisissez votre parcours pour passer directement à l’étape suivante.','أبحث عن حلاق':'Je cherche un barbier','اكتشف الحلاقين والخدمات في منطقتك':'Découvrez les barbiers et services près de chez vous','أنا حلاق أو حلاقة':'Je suis barbier ou barbière','أنشئ ملفك واستقبل طلبات العملاء':'Créez votre profil et recevez des demandes','رجوع':'Retour','هل أنت حلاق أم حلاقة؟':'Êtes-vous barbier ou barbière ?','اختر الصفة التي تناسبك للمتابعة إلى إنشاء ملفك.':'Choisissez votre profil pour créer votre compte.','حلاق':'Barbier','حلاقة':'Barbière','أتابع كحلاق':'Continuer comme barbier','أتابع كحلاقة':'Continuer comme barbière','ملفات الحلاقين تُراجع قبل ظهورها للعملاء':'Les profils sont vérifiés avant leur publication',
  'جارٍ تحميل الحلاقين':'Chargement des barbiers','حاول مجددًا':'Réessayer','متاح الآن':'Disponible maintenant','غير متاح الآن':'Indisponible','دقيقة':'min','منطقتك ضمن نطاق الخدمة المسجل':'Votre quartier est couvert','التغطية في هذا الحي غير مدرجة':'Ce quartier n’est pas indiqué comme couvert','رسوم التنقل:':'Frais de déplacement :','الملف':'Profil','اطلب موعدًا':'Demander un rendez-vous',
  'اختيارك، بخطوة محلية':'Un choix local, en toute simplicité','موعد حلاقة':'Un rendez-vous coiffure','يبدأ من حيّك.':'au départ de votre quartier.','اختر حلاقًا بنفسك، أو دعنا نرشّح لك الأنسب حسب نطاق الخدمة المسجل وتقييم العملاء.':'Choisissez un barbier ou laissez-nous vous recommander le meilleur selon sa zone de service et les avis.','خطوات الطلب':'Étapes de la demande','حدّد موقعك والخدمة':'Indiquez votre lieu et le service','اختر حلاقًا أو اطلب اقتراحًا':'Choisissez un barbier ou une recommandation','تابع رد الحلاق':'Suivez la réponse du barbier','ابدأ من التفاصيل':'Commencez par les détails','من أين نبدأ؟':'Par où commencer ?','إعادة ضبط':'Réinitialiser','الدولة':'Pays','اختر الدولة':'Choisissez un pays','المدينة':'Ville','اختر المدينة':'Choisissez une ville','الحي أو المنطقة':'Quartier ou zone','مثال: حي النخيل':'Ex. : quartier du Palmier','الخدمة المطلوبة':'Service souhaité','اختر الخدمة':'Choisissez un service','جارٍ تحميل الدول المدعومة…':'Chargement des pays disponibles…','تعذّر تحميل الدول. أعد المحاولة للمتابعة.':'Impossible de charger les pays. Réessayez pour continuer.','ابحث عن حلاق أو خدمة أو منطقة':'Rechercher un barbier, un service ou un quartier','طريقة اختيار الحلاق':'Mode de sélection du barbier','أختار بنفسي':'Je choisis','تصفّح الحلاقين المناسبين':'Parcourez les barbiers disponibles','اقترح لي حلاقًا':'Recommandez-moi un barbier','ترشيح حسب المنطقة والتقييم':'Selon la zone et les avis','ترشيح من بيانات الحلاقين المسجلين':'Recommandation selon les profils inscrits','نرتّب التغطية المطابقة أولًا، ثم التقييم وعدد المراجعات.':'La couverture est prioritaire, puis la note et le nombre d’avis.','اعثر على الأنسب':'Trouver le meilleur choix','نتيجة مناسبة':'résultat(s) correspondant(s)','الخدمة متصلة':'Service connecté','التغطية مبنية على مناطق الخدمة المسجلة لدى الحلاقين، وليست قياسًا للمسافة أو التوفر الفوري.':'La couverture repose sur les zones déclarées par les barbiers, et non sur la distance ou la disponibilité instantanée.',
  'ابدأ باختيار الدولة':'Commencez par choisir un pays','بعد تحديد الدولة ستظهر المدن والخدمات والحلاقون المتاحون فيها فقط.':'Les villes, services et barbiers disponibles dans ce pays s’afficheront.','تعذّر تحميل الحلاقين الآن. تحقق من اتصالك ثم أعد المحاولة.':'Impossible de charger les barbiers. Vérifiez votre connexion et réessayez.','ابدأ بالمدينة والخدمة':'Commencez par la ville et le service',' والحي':' et le quartier','سنُظهر حلاقين نشطين يقدمون الخدمة نفسها':'Les barbiers actifs proposant ce service apparaîtront',' ويغطون منطقتك المسجلة':' et couvrant votre zone','جاهز لاقتراح مناسب':'Prêt à trouver une recommandation','سيعتمد الترشيح على نطاق التغطية المسجل ثم التقييم وعدد المراجعات.':'La recommandation repose sur la zone déclarée, la note et le nombre d’avis.','لا يوجد تطابق في نطاق التغطية':'Aucun barbier ne couvre cette zone','لم نجد حلاقًا بهذه المواصفات':'Aucun barbier correspondant','تغيير التفاصيل':'Modifier les critères','هذا الترشيح مبني على بيانات نطاق الخدمة والتقييم، وليس على موقع GPS أو التوفر الفوري.':'Cette recommandation se base sur les zones et les avis, pas sur le GPS ni la disponibilité en temps réel.','مزايا الخدمة':'Les avantages','ملفات الحلاقين تُراجع قبل ظهورها':'Profils vérifiés avant publication','طلب مباشر':'Demande directe','والحلاق يؤكد الموعد':'Le barbier confirme le rendez-vous','نطاق واضح':'Une zone claire','حسب مناطق التغطية':'Selon les zones couvertes','كل طلب ينتظر رد الحلاق قبل أن يصبح موعدًا مؤكدًا.':'Chaque demande attend la réponse du barbier avant confirmation.','متابعة طلباتي':'Suivre mes demandes','هل أنت حلاق متنقل؟ انضم إلينا':'Barbier itinérant ? Rejoignez-nous',
  'تأكيد طلب الحجز':'Confirmation de la demande','إغلاق':'Fermer','جارٍ تحميل الملف':'Chargement du profil','لحظات ونكون جاهزين.':'Encore un instant.','تعذّر تحميل ملف الحلاق.':'Impossible de charger le profil du barbier.','وصل طلبك':'Demande envoyée','تم إرسال طلب الموعد':'Votre demande de rendez-vous a été envoyée','أرسلنا طلبك إلى حلاق متاح مناسب لموقعك. ستظهر موافقته أو انتقال الطلب إلى حلاق بديل في صفحة «طلباتي».':'Votre demande a été envoyée à un barbier disponible près de vous. Sa réponse ou son transfert vers un autre barbier apparaîtra dans « Mes demandes ».','الحلاق:':'Barbier :','الخدمة:':'Service :','السعر:':'Prix :','التنقل:':'Déplacement :','التاريخ والوقت:':'Date et heure :','رقم الطلب:':'Demande n° :','الحالة:':'Statut :','تم إرسال الطلب · المحاولة':'Demande envoyée · tentative','متابعة حالة الطلب':'Suivre la demande','إرسال التفاصيل للحلاق عبر واتساب':'Envoyer les détails au barbier sur WhatsApp','الخدمات والأسعار':'Services et tarifs','رسوم التنقل':'Frais de déplacement','تُضاف إلى قيمة الخدمة':'Ajoutés au prix du service','خطوة واحدة تفصلك عن موعدك':'Plus qu’une étape avant votre rendez-vous','اطلب أقرب حلاق متاح':'Demandez le barbier disponible le plus proche','الاسم':'Nom','اسمك الكامل':'Votre nom complet','رقم الهاتف':'Numéro de téléphone','رقم يمكن التواصل عليه':'Numéro où vous joindre','كيف تحدد موقعك؟':'Comment indiquer votre lieu ?','أدخل المنطقة يدويًا':'Saisir la zone manuellement','استخدم موقعي بموافقتي':'Utiliser ma position avec mon accord','أين ترغب باستقبال الحلاق؟':'Où souhaitez-vous recevoir le barbier ?','مشاركة موقعي':'Partager ma position','تم تحديد موقعي':'Position définie','لن نطلب الموقع إلا بعد ضغطك على الزر. نستخدمه لاختيار حلاق ضمن 30 كم.':'Votre position ne sera demandée qu’après avoir appuyé sur le bouton. Elle sert à trouver un barbier dans un rayon de 30 km.','التاريخ':'Date','الوقت':'Heure','ملاحظة للحلاق':'Note pour le barbier','(اختياري)':'(facultatif)','تفاصيل تساعد الحلاق على الاستعداد':'Détails utiles au barbier pour se préparer','جارٍ تحميل إعداد الدفع لهذه الدولة…':'Chargement des paramètres de paiement…','تعذّر تحميل إعداد الدفع لهذه الدولة.':'Impossible de charger les paramètres de paiement pour ce pays.','إعداد الدفع لهذه الدولة غير متاح حاليًا.':'Les paramètres de paiement ne sont pas disponibles pour ce pays.','إعداد الدولة مفعّل':'Paramètre du pays activé','إعداد الدولة غير مفعّل':'Paramètre du pays désactivé','مزود الدفع جاهز':'Prestataire de paiement prêt','مزود الدفع غير مهيأ بعد':'Prestataire de paiement non configuré','الدفع الإلكتروني متاح':'Paiement en ligne disponible','الدفع الإلكتروني غير متاح':'Paiement en ligne indisponible','لا يتم تحصيل أي مبلغ الآن.':'Aucun paiement ne sera prélevé maintenant.','لا يمكن إرسال طلب لهذا الملف قبل تحديد دولته.':'Impossible d’envoyer une demande avant d’indiquer le pays du profil.','جارٍ إرسال الطلب…':'Envoi de la demande…','إرسال طلب الموعد':'Envoyer la demande','إرسال الطلب لا يعني تأكيد الموعد. لا تكتب عنوان المنزل الكامل هنا؛ شاركه مباشرة مع الحلاق بعد تأكيد الموعد.':'L’envoi ne confirme pas le rendez-vous. N’indiquez pas votre adresse complète ici ; partagez-la directement avec le barbier après confirmation.',
  'حجوزاتك':'Vos rendez-vous','تابع حالة':'Suivez le statut','طلبات مواعيدك.':'de vos demandes.','تتحدث الحالات تلقائيًا عند رد الحلاق. هذه القائمة محفوظة على هذا الجهاز.':'Le statut est actualisé dès que le barbier répond. Cette liste est enregistrée sur cet appareil.','لا توجد طلبات محفوظة هنا':'Aucune demande enregistrée','بعد إرسال طلب موعد من هذا الجهاز، ستتمكن من suivre رده في هذه الصفحة.':'Après avoir envoyé une demande depuis cet appareil, vous pourrez suivre sa réponse ici.','جارٍ تحميل الحالة…':'Chargement du statut…','تعذّر تحميل الحالة':'Impossible de charger le statut','أرسلنا الطلب إلى حلاق بديل':'Demande transmise à un autre barbier','لا يوجد حلاق متاح حاليًا':'Aucun barbier disponible actuellement','إذا لم يصل رد خلال دقيقة، سنحاول مع حلاق آخر تلقائيًا.':'Sans réponse sous une minute, nous contacterons automatiquement un autre barbier.','عدد محاولات الإرسال:':'Nombre de tentatives :','إعادة المحاولة':'Réessayer','تحقق من اتصالك ثم أعد تحميل الصفحة.':'Vérifiez votre connexion puis rechargez la page.','نحدّث بيانات الطلب.':'Actualisation des informations de la demande.',
  'العمل الجيد يستحق أن يُرى.':'Le bon travail mérite d’être vu.','أنشئ ملفك كحلاق متنقل. بعد المراجعة، يستطيع العملاء القريبون منك اكتشاف خدماتك وإرسال طلبات حجز مباشرة.':'Créez votre profil de barbier itinérant. Après vérification, les clients proches pourront découvrir vos services et demander un rendez-vous.','استلمنا ملفك':'Profil reçu','جارٍ إرسال ملفك…':'Envoi de votre profil…','إرسال الملف للمراجعة':'Envoyer le profil pour vérification','إرسال الملف لا يعني نشره فورًا. نراجع المعلومات قبل عرضها على العملاء.':'L’envoi ne publie pas le profil immédiatement. Nous vérifions les informations avant leur mise en ligne.','تعذّر إرسال الملف. تحقق من الحقول، وتأكد أن البريد غير مسجل من قبل.':'Impossible d’envoyer le profil. Vérifiez les champs et que cette adresse e-mail n’est pas déjà utilisée.','معلومات ملفك':'Informations du profil','الاسم الذي يعرفك به العملاء':'Nom affiché aux clients','المدينة التي تعمل فيها':'Ville d’activité','الأحياء أو المناطق التي تغطيها':'Quartiers ou zones desservis','افصل بين المناطق بفاصلة':'Séparez les zones par une virgule','نبذة قصيرة عنك':'Quelques mots sur vous','رقم للتواصل معك':'Numéro pour vous joindre','البريد الإلكتروني للدخول':'Adresse e-mail de connexion','كلمة المرور':'Mot de passe','تأكيد كلمة المرور':'Confirmer le mot de passe','كلمتا المرور غير متطابقتين.':'Les mots de passe ne correspondent pas.','الخدمة':'Service','اسم الخدمة':'Nom du service','المدة بالدقائق':'Durée en minutes','السعر':'Prix','رمز العملة':'Code devise','إضافة خدمة أخرى':'Ajouter un service','الخدمة ':'Service ','يُحدد حسب الدولة':'Défini selon le pays','تُحدد العملة تلقائيًا حسب الدولة المختارة.':'La devise est définie automatiquement selon le pays choisi.','نراجع ملفك قبل نشره على المنصة.':'Nous vérifions votre profil avant sa publication.','رمز دخولك إلى لوحة الحلاق':'Votre code d’accès à l’espace barbier','استخدم بريدك وكلمة المرور للدخول. احتفظ برقم الملف والرمز الاحتياطي؛ لن نعرض الرمز مرة أخرى، وستحتاج إليه إذا نسيت كلمة المرور.':'Connectez-vous avec votre adresse e-mail et votre mot de passe. Conservez votre identifiant et votre code de secours : celui-ci ne sera affiché qu’une fois et sera nécessaire en cas d’oubli du mot de passe.','انسخ رقم الحلاق ورمز الاسترداد':'Copiez l’identifiant du barbier et le code de récupération',
  'تعذّر التحقق من الجلسة':'Impossible de vérifier la session','تحقق من اتصال الخدمة ثم أعد المحاولة. لن نعرض ملفات المراجعة قبل تأكيد صلاحية الدخول.':'Vérifiez votre connexion puis réessayez. Les profils à examiner resteront masqués jusqu’à validation de la session.','جارٍ التحقق من الجلسة':'Vérification de la session','مراجعة هادئة،':'Une vérification attentive,','بداية موثوقة.':'pour un départ fiable.','ادخل إلى قائمة الحلاقين المستقلين الذين ينتظرون التحقق قبل ظهورهم للعملاء.':'Consultez les profils des barbiers indépendants en attente de vérification.','كلمة مرور الفريق':'Mot de passe de l’équipe','أدخل كلمة المرور':'Saisissez le mot de passe','إخفاء كلمة المرور':'Masquer le mot de passe','إظهار كلمة المرور':'Afficher le mot de passe','إخفاء':'Masquer','إظهار':'Afficher','جارٍ التحقق…':'Vérification…','دخول آمن':'Connexion sécurisée','دخول خاص بفريق المراجعة':'Accès réservé à l’équipe de vérification','لوحة المراجعة':'Espace de vérification','مساحة الفريق':'Espace équipe','ملفات تنتظر':'Des profils attendent','عينك الخبيرة.':'votre regard expert.','تحقق من تفاصيل كل محترف، ثم قرر إن كان جاهزًا للظهور في دليل الحلاقين.':'Vérifiez chaque profil et décidez s’il peut apparaître dans le répertoire.','قيد المراجعة':'En attente de vérification','طلبات جديدة':'Nouvelles demandes','تهيئة مستقبلية':'Préparation future','إعداد الدفع حسب الدولة':'Paramètres de paiement par pays','هذا التبديل يحفظ تفضيل الإعداد فقط. لا ينشئ صفحة دفع ولا يعني أن التحصيل متاح.':'Ce réglage enregistre une préférence uniquement. Il ne crée pas de page de paiement et n’active pas l’encaissement.','جارٍ تحميل إعدادات الدول':'Chargement des paramètres par pays','تعذّر تحميل إعدادات الدفع للدول.':'Impossible de charger les paramètres de paiement par pays.','لا توجد دول متاحة لإعداد الدفع حاليًا.':'Aucun pays disponible pour configurer le paiement.','مزود الدفع غير مهيأ':'Prestataire de paiement non configuré','استقبال المدفوعات مفعّل':'Encaissement activé','لا يتم استقبال مدفوعات':'Aucun paiement accepté','الإعداد مفعّل':'Paramètre activé','الإعداد متوقف':'Paramètre désactivé','تعطيل':'Désactiver','تفعيل':'Activer','جاهزية مزود الدفع غير متوفرة حاليًا. تفعيل الإعداد لا يجعل الدفع مباشرًا، ولا يتم تحصيل أي مبلغ من العملاء.':'Le prestataire de paiement n’est pas prêt. Activer ce paramètre ne rend pas le paiement opérationnel et aucun montant ne sera prélevé.','قائمة الملفات':'Liste des profils','مراجعة كل ملف على حدة':'Vérifier chaque profil individuellement','بيانات مباشرة':'Données en direct','جارٍ تحميل طلبات المراجعة':'Chargement des profils à vérifier','لم نتمكن من تحميل الملفات':'Impossible de charger les profils','قد تكون الجلسة انتهت أو الاتصال غير مستقر. أعد المحاولة للمتابعة.':'La session a peut-être expiré ou la connexion est instable. Réessayez.','إعادة تحميل القائمة':'Recharger la liste','كل شيء في مكانه':'Tout est à jour','لا توجد ملفات معلّقة.':'Aucun profil en attente.','حين يرسل حلاق مستقل ملفه، سيظهر هنا لتراجعه قبل نشره للعملاء.':'Les profils soumis par les barbiers indépendants apparaîtront ici pour vérification.','العودة إلى الاكتشاف':'Retour à la recherche','رموز دخول الحلاقين الحاليين':'Codes d’accès des barbiers actifs','للملفات النشطة':'Pour les profils actifs','أصدر رمزًا للحلاقين المسجلين قبل تفعيل لوحة الطلبات، ثم أرسله لهم يدويًا. إصدار رمز جديد يعطّل الرمز السابق.':'Générez un code pour les barbiers inscrits avant l’activation de leur espace, puis transmettez-le. Un nouveau code invalide le précédent.','انسخه وأرسله للحلاق الآن؛ لن يظهر مرة أخرى.':'Copiez-le et envoyez-le au barbier : il ne sera plus affiché.','تعذّر تحميل الحلاقين الحاليين.':'Impossible de charger les barbiers actifs.','إصدار رمز الدخول':'Générer un code d’accès','تعذّر إصدار الرمز. تأكد من أن الملف نشط ثم حاول مجددًا.':'Impossible de générer le code. Vérifiez que le profil est actif puis réessayez.','نراجع اليوم، لنطمئن غدًا.':'Vérifier aujourd’hui, pour avancer sereinement demain.','ينتظر المراجعة':'En attente de vérification','وصل في':'Reçu le','نبذة عن الحلاق':'À propos du barbier','التواصل':'Contact','عرض التفاصيل':'Afficher les détails','إخفاء التفاصيل':'Masquer les détails','جارٍ الحفظ…':'Enregistrement…','رفض الملف':'Refuser le profil','اعتماد ونشر':'Approuver et publier','تعذّر حفظ القرار. بقي الملف في قائمة المراجعة؛ حاول مرة أخرى.':'Impossible d’enregistrer la décision. Le profil reste dans la liste ; réessayez.',
  'تم تأكيد الموعد':'Rendez-vous confirmé','لم نعثر على حلاق متاح':'Aucun barbier disponible','بانتظار رد الحلاق':'En attente de la réponse du barbier','تم رفض الطلب':'Demande refusée','طلباتك،':'Vos demandes,','في مكان واحد.':'réunies au même endroit.','راجع تفاصيل كل طلب، ثم أكّد الموعد أو ارفضه. سيظهر قرارك للعميل.':'Consultez chaque demande, puis confirmez ou refusez. Votre décision sera communiquée au client.','بانتظار ردك':'En attente de votre réponse','طلبات واردة':'Demandes reçues','إعدادات استقبال الطلبات':'Disponibilité pour les demandes','متاح لاستقبال الطلبات':'Disponible pour recevoir des demandes','متوقف عن استقبال الطلبات':'Indisponible pour les demandes','سيظهر موقعك الدقيق للمنظومة فقط لاختيار الأقرب.':'Votre position exacte ne sera visible que par le système, afin de trouver le barbier le plus proche.','يمكنك استقبال الطلبات حسب نطاق الأحياء المسجل في ملفك.':'Vous pouvez recevoir des demandes selon les quartiers indiqués dans votre profil.','إيقاف التوفر':'Désactiver la disponibilité','تشغيل التوفر':'Activer la disponibilité','تحديث موقعي':'Actualiser ma position','مشاركة موقعي لتحديد الأقرب':'Partager ma position pour trouver le plus proche','لم نتمكن من تحميل طلباتك':'Impossible de charger vos demandes','قد تكون جلستك انتهت. سجّل الدخول مجددًا أو أعد تحميل القائمة.':'Votre session a peut-être expiré. Reconnectez-vous ou rechargez la liste.','لا توجد طلبات بعد':'Aucune demande pour le moment','ستظهر هنا طلبات العملاء المرسلة إلى ملفك، ولن تظهر طلبات الحلاقين الآخرين.':'Les demandes des clients adressées à votre profil apparaîtront ici. Les demandes des autres barbiers ne sont pas visibles.','اختر قرارك ليظهر للعميل':'Choisissez une décision qui sera transmise au client','رفض الطلب':'Refuser la demande','تأكيد الموعد':'Confirmer le rendez-vous','رقم العميل':'Numéro du client','المنطقة':'Zone','ملاحظة العميل':'Note du client','فتح لوحة الحلاق':'Ouvrir l’espace barbier','تسجيل الخروج':'Se déconnecter','تعذّر تسجيل الدخول. راجع كلمة المرور وحاول مجددًا.':'Connexion impossible. Vérifiez le mot de passe et réessayez.','البريد الإلكتروني أو كلمة المرور غير صحيحة.':'Adresse e-mail ou mot de passe incorrect.','رقم الحلاق أو رمز الدخول غير صحيح.':'Identifiant barbier ou code d’accès incorrect.','تعذّر تحديث الحساب. تحقق من رقم الملف والرمز، وأن البريد غير مستخدم بحساب آخر.':'Impossible de mettre à jour le compte. Vérifiez l’identifiant, le code et que cette adresse n’est pas déjà utilisée.','تعذّر تحديث حالة التوفر. تحقق من الاتصال وحاول مجددًا.':'Impossible de mettre à jour la disponibilité. Vérifiez la connexion et réessayez.','تعذّر حفظ القرار. أعد تحميل القائمة وحاول مجددًا.':'Impossible d’enregistrer la décision. Rechargez la liste et réessayez.','البريد وكلمة المرور':'E-mail et mot de passe','رقم الملف والرمز':'Identifiant et code','طريقة دخول الحلاق':'Mode de connexion du barbier','البريد الإلكتروني':'Adresse e-mail','نسيت كلمة المرور أو تريد تفعيل بريد لحساب قديم؟':'Mot de passe oublié ou activation d’une adresse e-mail existante ?','دخول إلى الطلبات':'Accéder aux demandes','رمز الدخول':'Code d’accès','تعيين بريد وكلمة مرور أو استعادة كلمة المرور':'Configurer une adresse e-mail et un mot de passe ou le réinitialiser','تم تحديث بيانات الدخول':'Identifiants mis à jour','استخدم البريد الجديد وكلمة المرور لتسجيل الدخول. احفظ رمز الاسترداد الجديد؛ الرمز السابق لم يعد صالحًا.':'Connectez-vous avec votre nouvelle adresse et votre nouveau mot de passe. Conservez le nouveau code de récupération ; l’ancien n’est plus valide.','العودة إلى تسجيل الدخول':'Retour à la connexion','رقم الحلاق':'Identifiant du barbier','رمز الاسترداد':'Code de récupération','البريد الإلكتروني الجديد أو الحالي':'Nouvelle adresse e-mail ou adresse actuelle','كلمة المرور الجديدة':'Nouveau mot de passe','تحديث البريد وكلمة المرور':'Mettre à jour l’e-mail et le mot de passe','لا نرسل رسالة تحقق حاليًا. أدخل بريدًا تملكه واحفظ رمز الاسترداد الجديد بعد التحديث.':'Aucun e-mail de vérification n’est envoyé pour le moment. Saisissez une adresse qui vous appartient et conservez le nouveau code de récupération.','لا نرسل رسالة تحقق حاليًا؛ تأكد من صحة البريد واحفظ رمز الاسترداد الظاهر بعد التسجيل.':'Aucun e-mail de vérification n’est envoyé pour le moment. Vérifiez l’adresse e-mail et conservez le code de récupération affiché après l’inscription.','لا يمكن للحلاق الاطلاع إلا على طلباته':'Le barbier ne peut consulter que ses propres demandes','طلبات مواعيدك':'Vos demandes de rendez-vous','تنتظر قرارك.':'attendent votre décision.','العودة للاكتشاف':'Retour à la recherche',
};

Object.assign(translations, {
  'طلب موعد':'Demander un rendez-vous',
  'لم يصل رد من الحلاق السابق؛ أرسلنا الطلب إلى حلاق بديل.':'Le barbier précédent n’a pas répondu ; votre demande a été transmise à un autre barbier.',
  'صورة رمزية لـ':'Avatar de',
  'صورة':'Photo de',
  'تفضيل الدفع في':'préférence de paiement pour',
  'حذف الخدمة':'Supprimer le service',
  '12 حرفًا على الأقل':'12 caractères minimum',
  'مرحبًا':'Bonjour',
  'أرسلت طلب الموعد رقم':'j’ai envoyé la demande de rendez-vous n°',
  'الخدمة:':'Service :',
  'التاريخ:':'Date :',
  'الاسم:':'Nom :',
  'هاتف التواصل:':'Téléphone :',
  'المنطقة:':'Quartier :',
  'أرجو تأكيد الموعد.':'Merci de confirmer le rendez-vous.',
  'تم حفظ تفضيل الإعداد. لم يتم تفعيل تحصيل المدفوعات.':'Préférence enregistrée. L’encaissement des paiements n’est pas activé.',
  'انسخه وأرسله للحلاق الآن؛ لن يظهر مرة أخرى.':'Copiez-le et envoyez-le au barbier ; il ne sera plus affiché.',
  'رقم الطلب':'Demande n°',
  'أعد كتابة كلمة المرور':'Saisissez de nouveau le mot de passe',
  'انضمي كحلاقة':'Rejoindre comme barbière',
  'انضم كحلاق':'Rejoindre comme barbier',
  'تأكد أن رقم هاتفك صحيح حتى يتمكن العملاء من الوصول إليك.':'Vérifiez que votre numéro de téléphone est exact afin que les clients puissent vous joindre.',
  'رسوم التنقل':'Frais de déplacement',
  'بالعملة المحددة':'dans la devise choisie',
  'سنبحث عن حلاق متاح في':'Nous rechercherons un barbier disponible à',
  'يقدّم الخدمة ويغطي موقعك.':'proposant ce service et couvrant votre zone.',
  'ملف الحلاق':'Profil du barbier',
  'BarberLink · مساحة الحلاق':'BarberLink · Espace barbier',
  'فريق المراجعة':'Équipe de vérification',
  'رمز الدخول للحلاق':'Code d’accès du barbier',
  'جارٍ الحفظ…':'Enregistrement…',
  'راجِع التفاصيل':'Vérifier les détails',
  'حالة الطلب':'Statut de la demande',
  'تم حفظ تفضيل الإعداد':'Préférence enregistrée',
  '404 Page Not Found':'Page introuvable (404)',
  'Did you forget to add the page to the router?':'Cette page n’existe pas ou a été déplacée.',
  'Something went wrong':'Une erreur est survenue',
  'This part of the app hit an error. The rest of the app is still running.':'Cette partie de l’application a rencontré une erreur. Le reste reste disponible.',
  'Try again':'Réessayer',
  'إرسال التفاصيل للحلاق عبر واتساب':'Envoyer les détails au barbier sur WhatsApp',
  'لا يوجد حلاق نشط مسجل لتغطية':'Aucun barbier actif ne couvre',
  'ويقدم':'et proposant',
  'جرّب اختيار حلاق بنفسك أو غيّر المنطقة.':'Essayez de choisir un barbier ou modifiez la zone.',
  'لا يوجد حلاق نشط في':'Aucun barbier actif à',
  'يقدم خدمة':'propose le service',
  'حاليًا. جرّب خدمة أو مدينة أخرى.':'actuellement. Essayez un autre service ou une autre ville.',
  'التغطية مبنية على مناطق الخدمة المسجلة لدى الحلاقين، وليست قياسًا للمسافة أو التوفر الفوري.':'La couverture repose sur les zones déclarées par les barbiers, et non sur la distance ou la disponibilité instantanée.',
  'لا يوجد تطابق مسجل لهذا الحي تحديدًا. الخيارات أدناه تقدم الخدمة في مدينتك؛ يُرجى التأكد من التغطية قبل إرسال الطلب.':'Aucune couverture déclarée pour ce quartier. Les options ci-dessous proposent le service dans votre ville ; vérifiez la zone avant d’envoyer votre demande.',
  'إضافة خدمة أخرى':'Ajouter un service',
  'كل طلب ينتظر رد الحلاق قبل أن يصبح موعدًا مؤكدًا.':'Chaque demande attend la réponse du barbier avant confirmation.',
  'أختار بنفسي':'Je choisis','تصفّح الحلاقين المناسبين':'Parcourez les barbiers disponibles',
  'العمل الجيد يستحق أن يُرى.':'Le bon travail mérite d’être vu.',
  'BarberLink يقرّبك من أشخاص في منطقتك يبحثون عن خدمة شخصية موثوقة.':'BarberLink vous met en relation avec des personnes de votre quartier à la recherche d’un service de confiance.',
  'لا توجد طلبات محفوظة هنا':'Aucune demande enregistrée ici',
  'بعد إرسال طلب موعد من هذا الجهاز، ستتمكن من متابعة رده في هذه الصفحة.':'Après avoir envoyé une demande depuis cet appareil, vous pourrez suivre sa réponse ici.',
  'عينك الخبيرة.':'votre regard expert.',
  'تحقق من تفاصيل كل محترف، ثم قرر إن كان جاهزًا للظهور في دليل الحلاقين.':'Vérifiez chaque profil et décidez s’il peut apparaître dans le répertoire des barbiers.',
  'مساحة الفريق':'Espace équipe','طلبات جديدة':'Nouvelles demandes','طلبات واردة':'Demandes reçues',
  'مراجعة كل ملف على حدة':'Vérifier chaque profil individuellement',
  'ملفات الحلاقين تُراجع قبل ظهورها للعملاء':'Les profils sont vérifiés avant leur publication',
  'هذا الترشيح مبني على بيانات نطاق الخدمة والتقييم، وليس على موقع GPS أو التوفر الفوري.':'Cette recommandation se base sur les zones et les avis, pas sur le GPS ni la disponibilité en temps réel.',
  'مثال: الحي القديم، وسط المدينة، الضواحي الشمالية':'Ex. : vieille ville, centre-ville, banlieue nord',
  'خدماتك والأسعار':'Vos services et tarifs','الخدمات التي تقدمها':'Services proposés',
  'العودة إلى اكتشاف الحلاقين':'Retour à la découverte des barbiers',
  'الفريق المحلي':'Équipe locale','إلى باب عملائك.':'Jusqu’à la porte de vos clients.',
  'الاسم الكامل':'Nom complet','موقعي الحالي':'Ma position actuelle',
  'أدخل الحي أو شارك موقعك بموافقتك.':'Saisissez un quartier ou partagez votre position avec votre accord.',
  'اضغط مشاركة موقعي للسماح بالوصول إلى موقعك.':'Appuyez sur « Partager ma position » pour autoriser l’accès.',
  'المتصفح لا يدعم تحديد الموقع. يمكنك إدخال المنطقة يدويًا.':'Votre navigateur ne prend pas en charge la géolocalisation. Saisissez la zone manuellement.',
  'المتصفح لا يدعم تحديد الموقع. يمكنك استقبال الطلبات حسب نطاق الأحياء المسجل.':'Votre navigateur ne prend pas en charge la géolocalisation. Vous pouvez recevoir des demandes selon les quartiers déclarés.',
  'تعذّر إرسال طلبك. تحقق من البيانات والاتصال ثم حاول مرة أخرى.':'Impossible d’envoyer votre demande. Vérifiez les informations et la connexion, puis réessayez.',
  'لا يوجد حلاق متاح لهذه الخدمة والمنطقة الآن. جرّب إدخال منطقة أخرى أو أعد المحاولة لاحقًا.':'Aucun barbier disponible pour ce service et cette zone. Essayez une autre zone ou réessayez plus tard.',
  'لم نتمكن من الوصول إلى موقعك. اختر إدخال المنطقة يدويًا للمتابعة.':'Impossible d’accéder à votre position. Saisissez la zone manuellement pour continuer.',
  'لم نتمكن من الوصول إلى موقعك. يمكنك تشغيل التوفر دون مشاركة الموقع.':'Impossible d’accéder à votre position. Vous pouvez activer votre disponibilité sans la partager.',
  'شارك موقعك أولًا، أو اختر إدخال المنطقة يدويًا.':'Partagez d’abord votre position ou saisissez la zone manuellement.',
  'تعذّر تحميل الملف':'Impossible de charger le profil',
  'لا يمكن إرسال الطلب لهذا الملف لعدم تحديد الدولة.':'Impossible d’envoyer une demande : le pays de ce profil n’est pas défini.',
  'لا يمكن إرسال هذا الملف لعدم تحديد الدولة.':'Impossible d’envoyer cette demande : le pays du profil n’est pas défini.',
  'السعر يحدده الحلاق المتاح':'Le barbier disponible fixe le prix',
  'يظهر السعر قبل تأكيد الموعد':'Le prix s’affiche avant la confirmation du rendez-vous',
  'تعذّر حفظ إعداد الدولة. لم يتغير الإعداد؛ حاول مرة أخرى.':'Impossible d’enregistrer le paramètre du pays. Aucun changement effectué ; réessayez.',
  'تعذّر تسجيل الدخول. راجع كلمة المرور وحاول مجددًا.':'Connexion impossible. Vérifiez le mot de passe et réessayez.',
  'لم يتم تسجيل الخروج. يرجى المحاولة مرة أخرى.':'La déconnexion a échoué. Veuillez réessayer.',
  'جارٍ الإصدار…':'Génération en cours…','جارٍ الخروج…':'Déconnexion…',
  'جارٍ تحديث الحساب…':'Mise à jour du compte…','جارٍ تحميل الدول…':'Chargement des pays…','جارٍ تحميل الطلبات':'Chargement des demandes',
  'خدمة متصلة':'Service connecté','الخدمة متصلة':'Service connecté',
  'تعذّر حفظ القرار. أعد تحميل القائمة وحاول مجددًا.':'Impossible d’enregistrer votre décision. Rechargez la liste et réessayez.',
  'تعذّر تحميل الدول.':'Impossible de charger les pays.',
  'إعداد الدفع لهذه الدولة غير متاح حاليًا.':'Les paramètres de paiement ne sont pas disponibles pour ce pays.',
  'استخدم رقم الملف ورمز الاسترداد لتعيين بريد وكلمة مرور جديدين.':'Utilisez l’identifiant du profil et le code de récupération pour définir une nouvelle adresse e-mail et un nouveau mot de passe.',
  'سجّل الدخول ببريدك وكلمة المرور، أو استخدم بيانات الملف للحسابات القديمة.':'Connectez-vous avec votre adresse e-mail et votre mot de passe, ou utilisez les identifiants du profil pour les anciens comptes.',
  'رقم الحلاق أو رمز الدخول غير صحيح.':'Identifiant du barbier ou code d’accès incorrect.',
  'راجع تفاصيل كل طلب، ثم أكّد الموعد أو ارفضه. سيظهر قرارك للعميل.':'Consultez chaque demande, puis confirmez ou refusez. Votre décision sera communiquée au client.',
  'لا يوجد رد من الحلاق السابق؛ أرسلنا الطلب إلى حلاق بديل.':'Le barbier précédent n’a pas répondu ; votre demande a été transmise à un autre barbier.',
  'اعتذر الحلاق السابق؛ أرسلنا الطلب إلى حلاق بديل.':'Le barbier précédent a décliné ; votre demande a été transmise à un autre barbier.',
  'اعتذر الحلاقون الذين استلموا الطلب أو لم يتوفر بديل يغطي المنطقة. يمكنك تعديل المنطقة وإرسال طلب جديد.':'Les barbiers sollicités ont décliné, ou aucun autre ne couvre la zone. Modifiez la zone et envoyez une nouvelle demande.',
  'لم يرد الحلاقون المتاحون أو لم نجد بديلًا يغطي المنطقة. يمكنك تعديل المنطقة وإرسال طلب جديد.':'Les barbiers disponibles n’ont pas répondu, ou aucun remplaçant ne couvre la zone. Modifiez la zone et envoyez une nouvelle demande.',
  'يمكنك استقبال الطلبات حسب نطاق الأحياء المسجل في ملفك.':'Vous pouvez recevoir des demandes selon les quartiers indiqués dans votre profil.',
  'تصلك طلبات حجز حقيقية من عملاء قريبين.':'Recevez de vraies demandes de rendez-vous de clients proches.',
  'شارك خبرتك، مناطق التغطية، والخدمات التي تقدمها.':'Présentez votre expérience, les zones desservies et vos services.',
  'عرّف العملاء بخبرتك وطريقتك في العمل.':'Présentez votre expérience et votre façon de travailler aux clients.',
  'خلّ خبرتك توصل':'Faites connaître votre savoir-faire',
  'خطوتك التالية وصلت إلينا':'Votre prochaine étape est lancée',
  'للمحترفين المستقلين':'Pour les professionnels indépendants',
  'منطقتك ضمن نطاق الخدمة المسجل':'Votre zone est couverte',
  'لا يوجد تطابق مسجل':'Aucune couverture déclarée',
  'في هذا الحي تحديدًا. الخيارات أدناه تقدم الخدمة في مدينتك؛ يُرجى التأكد من التغطية قبل إرسال الطلب.':'pour ce quartier. Les options ci-dessous proposent le service dans votre ville ; vérifiez la couverture avant d’envoyer la demande.',
  'هذه القائمة محفوظة على هذا الجهاز.':'Cette liste est enregistrée sur cet appareil.',
  'شكرًا لانضمامك. سيراجع فريقنا معلوماتك قبل إظهار ملفك للعملاء.':'Merci de nous avoir rejoints. Notre équipe vérifiera vos informations avant de publier votre profil.',
  'خطأ':'Erreur','غير متاح':'Indisponible',
  'إخفاء التفاصيل':'Masquer les détails',
  'تعذّر تحميل الحالة':'Impossible de charger le statut',
  'جارٍ تحميل الحالة…':'Chargement du statut…',
  'تم إرسال طلب الموعد':'Votre demande de rendez-vous a été envoyée',
  'الملف':'Profil',
  'نراجع اليوم، لنطمئن غدًا.':'Vérifier aujourd’hui, pour avancer sereinement demain.',
});

export function getLocale(): Locale { return activeLocale; }
export function t(source: string): string {
  const exact = translations[source];
  if (activeLocale === 'ar') return source;
  if (exact) return exact;
  // Translate known fixed fragments while leaving API/user data intact.
  return Object.entries(translations).sort((a, b) => b[0].length - a[0].length)
    .reduce((text, [ar, fr]) => text.includes(ar) ? text.split(ar).join(fr) : text, source);
}

export function useLocale() {
  const [locale, setState] = useState<Locale>(() => {
    activeLocale = initialLocale();
    return activeLocale;
  });
  useEffect(() => {
    const listener = (next: Locale) => setState(next);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  return { locale, setLocale: (next: Locale) => {
    activeLocale = next;
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage may be unavailable */ }
    listeners.forEach((listener) => listener(next));
  } };
}

const originals = new WeakMap<Node, string>();
const renderedValues = new WeakMap<Node, string>();
const attributeRendered = new WeakMap<HTMLElement, Map<string, string>>();
function localizeDom(root: ParentNode, locale: Locale) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const current = node.textContent ?? '';
    if (node.parentElement?.closest('.card-bio, .bio, .review-bio p, .booking-note p, .area-tag, .location-line, .review-location, .card-name-row h3, .profile-title h2, .payment-country-copy strong')) continue;
    const priorOriginal = originals.get(node);
    const original = priorOriginal !== undefined && current === renderedValues.get(node)
      ? priorOriginal
      : current;
    originals.set(node, original);
    const translated = locale === 'fr' ? tFor(original) : original;
    if (current !== translated) node.textContent = translated;
    renderedValues.set(node, translated);
  }
  root.querySelectorAll<HTMLElement>('*').forEach((element) => {
    ['aria-label', 'aria-description', 'title', 'placeholder', 'alt'].forEach((attribute) => {
      const current = element.getAttribute(attribute);
      if (current === null) return;
      const key = `data-locale-original-${attribute}`;
      const rendered = attributeRendered.get(element) ?? new Map<string, string>();
      const original = element.getAttribute(key) !== null && current === rendered.get(attribute)
        ? element.getAttribute(key)!
        : current;
      element.setAttribute(key, original);
      const translated = translateAttribute(original, attribute, locale);
      if (current !== translated) element.setAttribute(attribute, translated);
      rendered.set(attribute, translated);
      attributeRendered.set(element, rendered);
    });
  });
}
function tFor(source: string) { return translations[source] ?? Object.entries(translations).sort((a,b)=>b[0].length-a[0].length).reduce((value,[ar,fr])=>value.includes(ar)?value.split(ar).join(fr):value,source); }
function translateAttribute(source: string, attribute: string, locale: Locale) {
  if (locale === 'ar') return source;
  if (attribute === 'placeholder' && source === 'قص شعر') return 'Coupe de cheveux';
  if (attribute === 'alt' && source.startsWith('صورة رمزية لـ ')) return `Avatar de ${source.slice('صورة رمزية لـ '.length)}`;
  if (attribute === 'alt' && source.startsWith('صورة ')) return `Photo de ${source.slice('صورة '.length)}`;
  if (attribute === 'aria-label' && source.startsWith('تعطيل تفضيل الدفع في ')) return `Désactiver la préférence de paiement pour ${source.slice('تعطيل تفضيل الدفع في '.length)}`;
  if (attribute === 'aria-label' && source.startsWith('تفعيل تفضيل الدفع في ')) return `Activer la préférence de paiement pour ${source.slice('تفعيل تفضيل الدفع في '.length)}`;
  return tFor(source);
}

export function LanguageControl() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const apply = () => localizeDom(document.body, locale);
    document.documentElement.lang = locale === 'ar' ? 'ar' : 'fr';
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    apply();
    const observer = new MutationObserver(() => apply());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'aria-description', 'title', 'placeholder', 'alt'] });
    return () => observer.disconnect();
  }, [locale]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const choose = (next: Locale) => {
    setLocale(next);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return createElement('div', {
    className: 'locale-switch',
    ref: rootRef,
  },
  createElement('button', {
    ref: triggerRef,
    type: 'button',
    className: 'locale-trigger',
    'aria-label': locale === 'ar' ? 'تغيير اللغة' : 'Changer de langue',
    title: locale === 'ar' ? 'تغيير اللغة' : 'Changer de langue',
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': 'barberlink-locale-menu',
    'data-testid': 'button-language-menu',
    onClick: () => setOpen((current) => !current),
  },
  createElement(Languages, { size: 18, 'aria-hidden': true }),
  createElement(ChevronDown, { size: 12, 'aria-hidden': true })),
  open ? createElement('div', {
    id: 'barberlink-locale-menu',
    className: 'locale-menu',
    role: 'group',
    'aria-label': locale === 'ar' ? 'اختر اللغة' : 'Choisir une langue',
  },
  createElement('button', {
    type: 'button',
    'aria-pressed': locale === 'ar',
    'data-testid': 'button-language-ar',
    onClick: () => choose('ar'),
  },
  createElement('span', { lang: 'ar', dir: 'rtl' }, 'العربية'),
  locale === 'ar' ? createElement(Check, { size: 14, 'aria-hidden': true }) : null),
  createElement('button', {
    type: 'button',
    'aria-pressed': locale === 'fr',
    'data-testid': 'button-language-fr',
    onClick: () => choose('fr'),
  },
  createElement('span', { lang: 'fr', dir: 'ltr' }, 'Français'),
  locale === 'fr' ? createElement(Check, { size: 14, 'aria-hidden': true }) : null)) : null);
}
