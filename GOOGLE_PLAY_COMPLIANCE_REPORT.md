# تقرير الجاهزية والتدقيق الشامل والتوافق مع سياسات Google Play — تطبيق «مسلم بلس» (`com.muslim.azan`)

**تاريخ التدقيق:** 2026-11-21  
**المعرّف الحزمي (`applicationId`):** `com.muslim.azan`  
**الإصدار (`versionName` / `versionCode`):** `2.2.0` (`12`)  
**مستويات SDK:** `minSdk = 24` · `compileSdk = 36` · `targetSdk = 36`  
**الوحدات البرمجية:** `:app` (الهاتف واللوحي Android Native Jetpack Compose + Java Services) و `:wear` (Wear OS) + واجهة الويب (React / Vite / Node API)  

> **النتيجة التنفيذية العامة: `يحتاج مراجعة يدوية` (قبل النشر الفعلي على Google Play Store)**  
> التحليل البرمجي لا يمكنه منح ضمان بقبول التطبيق في Google Play، لأن القبول النهائي يخضع لمراجعة فريق Google Play وإقرارات المطور اليدوية في Play Console. تم إصلاح **المخالفة التقنية المؤكدة في Manifest** (إزالة `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`) ومحاذاة سياسة الخصوصية مع السلوك الشبكي الفعلي، وتبقى إقرارات Play Console ومراجعة تراخيص الصوتيات/الصور والرابط الخلفي الدائم خطوات يدوية واجبة على الناشر.

---

## 1. ملخص التطوير والإصلاحات المنفّذة مباشرة في المشروع

### 1.1 إصلاح البناء والموثوقية في الخلفية (Android 15 / 16)
1. **تجنّب أخطاء الترتيب في `AzkarAudioService.java`:** استخدام method references (`this::handleShortToneTimeout`, `this::handleAutoDismissOverlayTest`) وإدارة آمنة لـ `AudioFocusRequest` عبر `AzanAudioPolicy.shouldAbortOnFocusDenied` حتى لا يتوقف الأذان أو الإقامة أو التنبيهات الحرجة عند تعذر الحصول الفوري على AudioFocus، مع استخدام معرفات تسلسلية `QUEUE_SEQ.incrementAndGet()` لمنع تصادم طابور الأذكار والصلوات على النبي ﷺ.
2. **الأذان والتنبيهات الدقيقة في السكون وإعادة التشغيل:**
   - جدولة الأذان والمنبهات الدقيقة عبر `AlarmManager.setAlarmClock` + حارس الأذان التلقائي `AlarmScheduler.java` و`BootReceiver.java` و`AlarmScheduleTracker.java` (`reconcileScheduleReplacement` بحيث لا تُحذف المنبهات الصحيحة عند فشل إعادة الحساب).
   - حماية خيط استرجاع وضع الرنين `RingerRestoreCoordinator.kt` عند سحب إذن DND (`PERMISSION_REVOKED_RETAINED`).
   - تسجيل خدمة تشغيل القرآن `QuranPlaybackService` بـ `foregroundServiceType="mediaPlayback"` للعمل المستقر عند قفل الشاشة.
3. **الحفاظ على الموارد والتصميم في APK Release:**
   - ضبط `shrinkResources false` مؤقتًا مع `res/raw/keep.xml` لحفظ جميع صور `drawable-nodpi` وملفات الصوت في Release دون حذف.
   - توحيد توقيع الإصدار في `android/signing.gradle` و`android/app/build.gradle` و`android/wear/build.gradle` مع تفعيل V1/V2/V3 وإبقاء مهام CI لبناء **Release APK فقط (بدون AAB)** طبقًا لطلبك.

### 1.2 إصلاح Google Play المؤكد: صلاحية تحسين البطارية (`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`)
- **المشكلة (`مخالفة مؤكدة` سابقًا):** وجود `<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />` في `AndroidManifest.xml` يسبب رفضًا تلقائيًا من Google Play لتطبيقات الأذان والمواقيت لأنها لا تندرج ضمن الفئات المستثناة لهذه الصلاحية المباشرة.
- **الإصلاح المنفّذ (`متوافق` الآن):**
  - أُزيلت الصلاحية بالكامل من `android/app/src/main/AndroidManifest.xml`.
  - جرى تحديث `SystemPermissionHelper.openBatteryOptimizationSettings` ليفتح صفحة إعدادات النظام القياسية `Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS` مع بديل احتياطي لصفحة تفاصيل التطبيق `ACTION_APPLICATION_DETAILS_SETTINGS`.
  - يظل التحقق عبر `PowerManager.isIgnoringBatteryOptimizations(packageName)` يعمل طبيعيًا بدون الصلاحية المحظورة، وتعتمد الجدولة الدقيقة أساسًا على `setAlarmClock` لإيقاظ الجهاز في وضع Doze.

### 1.3 دعم اللغتين العربية والإنجليزية واتجاه الواجهة الفعلي (RTL / LTR)
- إضافة `/android/app/src/main/res/values-en/strings.xml` لاسم التطبيق بالإنجليزية (`Muslim Plus`) مع `resourceConfigurations += ['ar', 'en']`.
- تطوير `AlMoazenTheme` في `Theme.kt` لتمرير `LocalLayoutDirection` (`LayoutDirection.Rtl` أو `LayoutDirection.Ltr`) تفاعليًا على مستوى الشجرة البصرية بالكامل.
- ربط `MainActivity.kt` بحالة لغة تفاعلية (`appLanguage`: `'ar'` / `'en'` / `'auto'`) تتحدّث فورًا عند الاختيار وتُطبّق على `BottomNavBar`، و`HomeScreen` (بطاقات المواقيت، الصلاة القادمة، طريقة الحساب، آية اليوم، وجميع بطاقات الشبكة الـ 19)، وشاشة `SettingsScreen` (بما فيها مبدّل اللغة التفاعلي في القسم 4 واتجاه الأسهم والرجوع)، وحوار الخروج، مع الحفاظ على نصوص القرآن والأذكار العربية الأصلية.

### 1.4 إصلاح شفافية سياسة الخصوصية + إصلاح برمجي في `public/sw.js`
- استبدال نص سياسة الخصوصية غير الدقيق ("تعمل جميع وظائف التطبيق 100% محليًا بدون خوادم") في كل من `SettingsScreen.kt` (بالعربية والإنجليزية) و`SettingsModal.tsx` بنص صريح يوضح:
  - بقاء المواقيت والمصحف والأذكار والتسبيح والمفضلة محليًا بدون حساب مستخدم.
  - استخدام `OpenStreetMap Nominatim` عبر HTTPS فقط عند الضغط على تحديث الموقع التلقائي أو البحث العالمي.
  - إرسال التسجيل الصوتي اختياريًا في «الشيخ الذكي» عند طلب التصحيح اليدوي فقط.
  - عدم وجود إعلانات أو شبكات تتبع إعلانية.
- إصلاح خطأ مرجعي في `public/sw.js` داخل مستمع `fetch` (`ReferenceError: url is not defined`) عبر تعريف `const url = new URL(event.request.url);` مع تنظيف قائمة الأصول غير المتصلة.

---

## 2. سجل التنظيف والملفات المحذوفة (توثيق كامل)

تم حذف الملفات المؤكد خلوّها من أي استخدام أو المطابقة ثنائيًا (SHA256 مطابق لنسخة أخرى معتمدة)، مع تحديث كل المراجع والاختبارات دون حذف أي تصميم أو صوت أو ميزة:

| # | المسار المحذوف | الحجم (بايت) | سبب الحذف والأمان الوظيفي | الإجراء البديل / التحقق |
|---|---|---|---|---|
| 1 | `android/app/src/main/res/drawable-nodpi/bg_quran_widget_mosque.jpg` | 891,660 | صورة مطابقة تمامًا (نفس بصمة SHA256) لملف `img_hadith_mosque.jpg` | توحيد الـ 3 مراجع في `QiblaScreen.kt` و`TasbihScreen.kt` و`MoazenWidgetCard.kt` إلى `R.drawable.img_hadith_mosque` |
| 2 | `android/app/src/main/assets/audio/ibrahim_madani.mp3` | 379,784 | ملف صوتي مطابق تمامًا ثنائيًا (نفس بصمة SHA256) لملف `madinah.mp3` | التحقق من وجود التحويل التلقائي `"ibrahim_madani" -> "madinah.mp3"` في `AzanAudioPolicy.kt` و`AzkarAudioService.java` وتحديث `AzanAudioPolicyAndAssetsTest.kt` |
| 3 | `android/app/src/main/assets/audio/qiyam_last_third.mp3` | 957,740 | غير مستخدم نهائيًا داخل مشروع `android/` (0 مراجع)؛ بينما بقي `/public/audio/qiyam_last_third.mp3` لتطبيق الويب | فحص جميع ملفات Java/Kotlin/XML؛ بقاء نسخة الويب دون مساس |
| 4 | `public/assets/aistudio/Hisham_Abbas_-_Asmaa_Allah_Al_Hosna__Lyrics_______________-__________________________48k__73f3bd99.mp3` | 821,900 | نسخة مكررة مطابقة (SHA256) لملف `/public/audio/asmaa_allah_al_husna.mp3` | تحديث `ASMAA_FALLBACK_URL` في `src/utils/diskAudioPlayerService.ts` إلى `/audio/asmaa_allah_al_husna.mp3` |
| 5 | `public/assets/images/mosque_header_bg_1792330870635.jpg` | 948,693 | صورة يتيمة غير مستخدمة في أي مكون React أو CSS | حذف المرجع من `OFFLINE_ASSETS` في `public/sw.js` |
| 6 | `public/assets/images/mosque_sunset_header_1792265336563.jpg` | 772,306 | صورة يتيمة غير مستخدمة في أي مكون React أو CSS | حذف المرجع من `OFFLINE_ASSETS` في `public/sw.js` |
| 7 | `public/assets/images/quran_rehal_wood_1792265354181.jpg` | 875,388 | صورة يتيمة غير مستخدمة في أي مكون React أو CSS | حذف المرجع من `OFFLINE_ASSETS` في `public/sw.js` |
| 8 | `android/scripts/__pycache__/verify_release_apk.cpython-311.pyc` | 5,812 | كاش بايثون مؤقت لا ينبغي تتبعه في المستودع | إضافة `**/__pycache__/` و`*.pyc` إلى `.gitignore` |

**إجمالي المساحة المحررة:**
- **داخل أصول Android APK مباشرة:** `2,229,184` بايت (**≈ 2.13 ميجابايت** توفرها مباشرة داخل حزمة `AlMoazen-v2.2.0-release.apk`).
- **داخل مستودع الويب والكاش:** `3,424,099` بايت (**≈ 3.27 ميجابايت**).
- **الإجمالي الكلي المحرّر:** `5,653,283` بايت (**≈ 5.39 ميجابايت**).

**ملحوظة حول تبعية غير مستخدمة أُبقيت عمدًا:**
- `"motion": "^12.23.24"` في `package.json` لا توجد لها استيرادات في `src/` (المشروع يستخدم `framer-motion`)، وقد أُبقيت دون تعديل لتفادي عدم اتساق `package-lock.json` بدون شبكة registry؛ يمكن إزالتها لاحقًا بأمر `npm uninstall motion`.

---

## 3. تدقيق أذونات `AndroidManifest.xml` وفق سياسات Google Play

تم فحص جميع الأذونات الـ 15 المعلنة حاليًا في `android/app/src/main/AndroidManifest.xml`:

| الإذن (`Permission`) | الغرض داخل التطبيق | التصنيف | التفصيل والمتطلب في Play Console |
|---|---|---|---|
| `INTERNET` | جلب المدن عبر Nominatim، بث التلاوات، خلفيات المساجد، وتصحيح التسميع الاختياري | `متوافق` | استخدام HTTPS مشفر فقط (`usesCleartextTraffic="false"`). |
| `ACCESS_NETWORK_STATE` | التحقق من توفر الاتصال قبل التحميل أو المزامنة | `متوافق` | إذن عادي لا يتطلب موافقة مستخدم. |
| `POST_NOTIFICATIONS` | إظهار إشعارات الأذان والأذكار ومشغل القرآن (Android 13+) | `متوافق` | يُطلب وقت التشغيل مع مبرر واضح. |
| `WAKE_LOCK` | إبقاء المعالج مستيقظًا لحظات بدء الأذان فقط (`PARTIAL_WAKE_LOCK` ثم تحرير فوري) | `متوافق` | مُقيّد بمدة زمنية (`timeout`) ومحرّر عند التوقف. |
| `RECEIVE_BOOT_COMPLETED` | إعادة جدولة جميع الصلوات والأذكار بعد إعادة تشغيل الهاتف | `متوافق` | جوهري لتطبيق أوقات الصلاة (`BootReceiver`). |
| `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_MEDIA_PLAYBACK` | تشغيل صوت الأذان وتلاوة القرآن عند قفل الشاشة (`AzkarAudioService`, `QuranPlaybackService`) | `متوافق` | النوع المعلن `mediaPlayback` يطابق الوظيفة الفعلية على Android 14/15/16. يجب توضيحه عند طلب استبيان Foreground Service في Play Console إذا طُلب. |
| `VIBRATE` | اهتزاز تنبيه الأذان والإقامة والسبحة | `متوافق` | إذن عادي. |
| `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION` | تحديد المدينة والقبلة بدقة (عند طلب المستخدم فقط — لا يوجد `ACCESS_BACKGROUND_LOCATION`) | `متوافق` | موقع أمامي فقط؛ يجب الإفصاح في Data Safety عن إرسال الإحداثيات عند استخدام التحديد التلقائي عبر Nominatim. |
| `ACCESS_NOTIFICATION_POLICY` | تفعيل وضع الصامت أثناء الصلاة واستعادته تلقائيًا (`RingerRestoreCoordinator`) | `متوافق` | يُفتح للمستخدم يدويًا عبر إعدادات DND عند تفعيل الخيار. |
| `RECORD_AUDIO` | ميزة تسميع القرآن «الشيخ الذكي» عند الضغط على زر التسجيل فقط | `متوافق` | إذن حساس يُطلب وقت الحاجة فقط؛ يتطلب الإفصاح في Data Safety عن جمع الصوت مؤقتًا للتحليل عند الاستخدام. |
| `SCHEDULE_EXACT_ALARM` | جدولة الأذان والإقامة في الثانية المحددة على Android 12–16 | `خطر محتمل` / `يحتاج مراجعة يدوية` | استبدال `USE_EXACT_ALARM` بهذا الإذن كان قرارًا صحيحًا، لكن على targetSdk 36 يطلب Google Play في صفحة App Content تبرير فئة الاستخدام (Alarms / Prayer Reminders). |
| `USE_FULL_SCREEN_INTENT` | عرض شاشة الأذان الكاملة على شاشة القفل (`AzanAlertActivity`) | `خطر محتمل` / `يحتاج مراجعة يدوية` | على Android 14+ تخضع هذه الصلاحية لمراجعة Google Play؛ في Play Console قد يُفضّل حصرها في فئة المنبهات/المكالمات أو تعطيل التفعيل التلقائي من Play وإرشاد المستخدم يدويًا (`ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT`) وهو ما يدعمه التطبيق حاليًا. |
| `SYSTEM_ALERT_WINDOW` | نافذة الأذان والأذكار العائمة فوق التطبيقات (ميزة اختيارية بالضغط اليدوي) | `خطر محتمل` / `يحتاج مراجعة يدوية` | يراقب Google Play هذا الإذن بدقة؛ يجب ألا يُجبر المستخدم على منحه في شاشة البداية كشرط لاستخدام التطبيق (حاليًا يتوفر زر "تخطي" والتشغيل دونها). |
| `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` | *(أُزيل من Manifest)* | `متوافق` (بعد الإصلاح) | تم حذفه نهائيًا من `AndroidManifest.xml` وتحويله إلى توجيه سليم لإعدادات النظام. |

---

## 4. المكتبات، الاتصالات الخارجية، ونموذج أمان البيانات (Data Safety)

### 4.1 المكتبات الاعتمادية (Dependencies)
- **Android (`android/app/build.gradle`):** Compose BOM `2024.06.00`، AndroidX Core/AppCompat/Lifecycle/Navigation، `androidx.media:media:1.7.0`، `androidx.work:work-runtime-ktx:2.9.1`، `com.google.android.gms:play-services-location:21.3.0`، `com.google.code.gson:gson:2.10.1`.
  - **لا توجد أي مكتبة إعلانات (AdMob / AppLovin / Unity Ads) أو تتبع تحليلي (Firebase Analytics / Facebook SDK / AppsFlyer) أو فوترة.** (`متوافق`).
- **الأجهزة القابلة للارتداء (`android/wear/build.gradle`):** Wear Compose + Horologist/Tiles القياسية بدون SDKs تتبعية. (`متوافق`).

### 4.2 نقاط الاتصال الشبكي الفعلية
| الجهة المستهدفة | الغرض والبيانات المرسلة | الملفات المرجعية | التصنيف والتوصية |
|---|---|---|---|
| `https://nominatim.openstreetmap.org/reverse` و `/search` | تحويل إحداثيات GPS إلى اسم مدينة أو البحث النصي عن مدينة | `NativeDataManager.kt`, `citySearch.ts`, `SettingsModal.tsx` | `خطر محتمل` (السياسة كانت تنكر الإرسال سابقًا، وتم **إصلاح السياسة** لتذكره صراحة؛ التزم بـ User-Agent واضح وسياسة Nominatim Usage Policy وعدم إرسال طلبات تلقائية متكررة في الخلفية). |
| `https://ais-pre-aogd7h5zvrwkdpwfi6su4v-613282291771.europe-west3.run.app` | عنوان الخادم الافتراضي الاحتياطي لتحليل تلاوة «الشيخ الذكي» (`sheikhServerBaseUrl`) | `NativePreferences.kt` (السطر 701–702) | `خطر محتمل` / `يحتاج مراجعة يدوية` — هذا رابط معاينة مؤقت لبيئة AI Studio؛ **يجب استبداله بنطاق HTTPS إنتاجي دائم** يملكه الناشر قبل إطلاق Google Play، وإلا ستتعطل ميزة «الشيخ الذكي» عند انتهاء صلاحية حاوية المعاينة. |
| `https://server*.mp3quran.net/` و `https://everyayah.com/data/` | بث وتحميل تلاوات القرآن الكريم عبر HTTPS | `MediaFileManager.kt`, `SheikhTutorSection.kt`, `quranAudioService.ts`, `SmartSheikhTutor.tsx` | `يحتاج مراجعة يدوية` (التحقق من ثبات المصادر وتوافق الاستخدام والتراخيص — راجع القسم 6). |
| `https://thumb.wikimedia.org/...` و `https://images.pexels.com/...` و `https://images.unsplash.com/...` | صور الخلفيات الإسلامية وصور شاشات المعاينة | `WallpapersScreen.kt`, `recitersData.ts` | `يحتاج مراجعة يدوية` (مراجعة شروط نسب المصنف `CC BY-SA` لـ Wikimedia ومجانية Pexels/Unsplash داخل وصف المتجر أو صفحة «عن التطبيق»). |
| `https://www.youtube.com/@MakkahLive` و `@MadinahLive` | روابط خارجية للبث المباشر الرسمي للحرمين الشريفين | `MoreModal.tsx` | `متوافق` (روابط خارجية مباشرة لفتح القنوات الرسمية). |

---

## 5. سياسة الخصوصية والإعلانات والفوترة

1. **التطابق مع سياسة الخصوصية (`تم الإصلاح -> متوافق داخليًا / يحتاج رابط ويب خارجي`):**
   - تم تحديث نص السياسة داخل `SettingsScreen.kt` (عربي/إنجليزي) و`SettingsModal.tsx` ليكون متسقًا 100% مع السلوك الحقيقي للتطبيق.
   - **متطلب Google Play الإلزامي:** بما أن التطبيق يستخدم `RECORD_AUDIO` و`ACCESS_FINE_LOCATION`، يفرض Google Play وضع **رابط URL عام لصفحة ويب تحتوي سياسة الخصوصية** داخل Play Console (ولا يكتفي بالنص المدمج داخل التطبيق فقط).
2. **الإعلانات والمدفوعات والتبرعات:**
   - التطبيق مجاني بالكامل وخالٍ من الإعلانات (Zero Ads) وخالٍ من المشتريات داخل التطبيق (Zero IAP)، ولا يحتوي على بوابات دفع خارجية أو روابط جمع تبرعات نقدية مخالفة لسياسة Google Play Payments. (`متوافق`).

---

## 6. تدقيق حقوق الملكية الفكرية (Copyright / IP Audit) — **`يحتاج مراجعة يدوية` / `خطر محتمل`**

تُشدد Google Play على رفض التطبيقات التي تضم محتوى صوتيًا أو مرئيًا محميًا بحقوق طبع ونشر بدون إثبات ترخيص أو تصريح استخدام تجاري/توزيعي:

| الأصل / المصدر | الموضع | مستوى الخطورة | التوصية اليدوية للناشر |
|---|---|---|---|
| `asmaa_allah_al_husna.mp3` (أنشودة أسماء الله الحسنى — هشام عباس) | `android/app/src/main/assets/audio/asmaa_allah_al_husna.mp3` و`public/audio/asmaa_allah_al_husna.mp3` | `مخالفة مؤكدة` محتملة (إن لم يوجد ترخيص) | عمل فني تجاري محمي بالحقوق؛ يُنصح بشدة باستبداله بتسجيل صوتي مرخّص بملكية عامة (`CC0`) أو تسجيل أصلي أو إزالته ما لم يمتلك الناشر ترخيص توزيع خطي. |
| `musaharati_2.mp3` (المسحراتي — سيد مكاوي) و`musaharati_1.mp3` | `android/app/src/main/assets/audio/` | `خطر محتمل` | أعمال تراثية/إذاعية قد تكون مملوكة الحقوق لشركات إنتاج؛ تحقق من رخصة التوزيع أو استبدلها بصوت مرخص حر. |
| أصوات الأذان والإقامة المدمجة (`makkah.mp3`, `madinah.mp3`, `abdulbasit_fajr.mp3`, `iqama_*`, إلخ) وبث `mp3quran.net` / `everyayah.com` | `assets/audio/` وخدمات التلاوة | `يحتاج مراجعة يدوية` | بعض تسجيلات القراء والمؤذنين تعود لجهات إنتاج صوتي؛ احتفظ ببيان المصدر/الترخيص في حال طلبت مراجعة Google Play إثبات الاستخدام المصرّح به (Permission to use third-party audio). |
| صور الخلفيات من Wikimedia Commons | `WallpapersScreen.kt` | `خطر محتمل` | معظم صور Wikimedia Commons خاضعة لرخص `CC BY` أو `CC BY-SA` التي تشترط ذكر اسم المصوّر والترخيص (`Attribution`)؛ يُوصى بإضافة اسم المصوّر والرخصة أسفل كل صورة أو في قائمة اعتمادات. |

---

## 7. التدقيق الأمني وتوافق `targetSdk 36` (Android 16)

| البند الأمني | الحالة الفعلية في الكود | التصنيف |
|---|---|---|
| الاتصال غير المشفر (`Cleartext HTTP`) | `android:usesCleartextTraffic="false"` + `network_security_config.xml` يمنع أي اتصال `http://` | `متوافق` |
| النسخ الاحتياطي (`allowBackup`) | `allowBackup="true"` مقترن بملفّي `backup_rules.xml` و`data_extraction_rules.xml` اللذين يستبعدان `sheikh_recordings/` و`azan_runtime_state_prefs.xml` | `متوافق` |
| المكونات المُصدّرة (`exported`) | فقط `MainActivity` (LAUNCHER) و`BootReceiver` (أحداث النظام `BOOT_COMPLETED`, `TIMEZONE_CHANGED`...) مضبوطان `exported="true"`؛ أما `AzanAlertActivity` و`AzkarAlarmReceiver` و`AzkarAudioService` و`QuranPlaybackService` و`FileProvider` فكلها `exported="false"` | `متوافق` |
| `PendingIntent` Mutability | جميع `PendingIntent` في `AlarmScheduler.java` و`BootReceiver.java` و`AzkarAudioService.java` و`AzanAlertActivity.kt` تستخدم `FLAG_IMMUTABLE` (تحقق مطلوب على Android 14+/16) | `متوافق` |
| محاذاة 16 كيلوبايت (`16 KB Page Size`) | التطبيق ووحدة `:wear` مكتوبان بـ Kotlin/Java الصرف دون أي مكتبات أصلية (`.so` / NDK)، لذا يلتزم آليًا بمتطلب Google Play للـ 16 KB page size | `متوافق` |
| تقليص الكود (R8 / ProGuard) | `minifyEnabled true` مع حفظ فئات Location وMedia وBroadcast/Service الحيوية وعدم استخدام قواعد `-keep` شاملة تعطل التحسين | `متوافق` |
| تخزين مفاتيح التوقيع | `signing.gradle` يقرأ المفاتيح من متغيرات البيئة (`KEYSTORE_FILE`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`) دون إيداع أي كلمات سر داخل الكود | `متوافق` |
| صيغة الحزمة (APK مقابل AAB) | مسارات CI تبني **Release APK فقط** بناءً على طلب المستخدم الصريح؛ عند الرفع الفعلي إلى Google Play Store يجب توليد `.aab` موقع بمفتاح الإطلاق الرسمي الدائم | `خطر محتمل` (تشغيلي عند النشر في المتجر) |

---

## 8. الخطوات اليدوية المطلوبة من الناشر قبل النشر على Google Play Console

1. **إعداد خادم دائم للشيخ الذكي:** استبدال الرابط المؤقت `https://ais-pre-...run.app` في `NativePreferences.kt` بنطاق خادم الإنتاج الدائم الخاص بك (أو تمرير العنوان عبر إعدادات البناء).
2. **نشر صفحة سياسة الخصوصية على الويب:** رفع ملف HTML بسيط على موقعك/GitHub Pages وإدخال رابطه في خانة Privacy Policy بـ Google Play Console.
3. **تعبئة نماذج App Content في Play Console بدقة:**
   - **Data Safety:** الإفصاح عن: (أ) جمع **الموقع الجغرافي** اختياريًا لإرسال الإحداثيات إلى Nominatim عند بحث/تحديد المدينة دون تخزين دائم على خوادم المطور؛ (ب) إرسال **ملف صوتي** مؤقت للخادم عند استخدام «الشيخ الذكي» فقط؛ (ج) لا مشاركة لأغراض إعلانية ولا جمع معرّفات أجهزة.
   - **Alarms & Reminders (`SCHEDULE_EXACT_ALARM`):** اختيار فئة منبهات أوقات الصلاة والشعائر الدينية الحرجة بالوقت.
   - **Full-Screen Intent (`USE_FULL_SCREEN_INTENT`):** تبرير تنبيه الأذان الكامل عند شاشة القفل (أو تعطيل الصلاحية إن رفضتها المراجعة مع بقاء الإشعار والصوت العاديين).
   - **Display Over Other Apps (`SYSTEM_ALERT_WINDOW`):** تبرير النافذة العائمة الاختيارية للأذان والأذكار.
   - **Foreground Service (`mediaPlayback`):** فيديو توضيحي قصير إن طُلب يوضح استمرار تشغيل الأذان وتلاوة القرآن عند قفل الشاشة مع إشعار التحكم الظاهر.
4. **مراجعة تراخيص الصوتيات التجارية:** إزالة أو استبدال `asmaa_allah_al_husna.mp3` (هشام عباس) و`musaharati_2.mp3` (سيد مكاوي) بصوتيات حرة الحقوق أو إرفاق مستندات الترخيص لتجنب الرفض بسبب IP.
5. **توقيع النشر الدائم وAAB للرفع إلى Play:** عند النشر النهائي على Google Play (بخلاف طلب Build Release APK الحالي)، استخدم مفتاح توقيع دائم (Upload Keystore) في GitHub Secrets، ووقّع نسخة `.aab` عند الرفع للمتجر مع الاحتفاظ بمفتاح الرفع بأمان تام.

---

## 9. سجل التحقق والاختبارات الفعلي (Verification Ledger)

> التزامًا بالشفافية الكاملة: يُفرّق هذا الجدول بدقة بين ما جرى فحصه وتشغيله محليًا داخل بيئة العمل، وما يتطلب تشغيل GitHub Actions أو جهاز Android حقيقي (لعدم وجود Android SDK / JDK / Gradle محليًا في الحاوية):

| الفحص | النتيجة | البيئة والنطاق |
|---|---|---|
| فحص أذونات Manifest، التطابق المرجعي لجميع `R.drawable.*`، انعدام المراجع المتبقية للملفات المحذوفة، وتوازن الأقواس في Kotlin/Java | نجح | فحص ساكن محلي عبر Python (`PY_COMPILE_OK` كذلك لسكربت `verify_release_apk.py`) |
| `npx tsx src/tests/muslimPlusCore.test.ts` | نجح (6/6 مجموعات اختبار) | بيئة Node محلية (حسابات المواقيت، المناطق الزمنية، خطوط العرض العليا، أولوية الصوت، الأذكار/الصلوات، المحتوى اليومي) |
| `npx tsx src/tests/azanSchedulingAndAudioIntegration.test.ts` | نجح (3/3 مجموعات تكامل) | بيئة Node محلية (عدم إلغاء المنبهات، AudioFocus، إزالة `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`، حذف المكررات، دعم RTL/LTR، شفافية الخصوصية، حظر AAB في CI) |
| فحص بنية ملفات CI وصحة `public/sw.js` (`node --check`) | نجح (`SW_JS_SYNTAX_OK`) | بيئة محلية (التأكد من خلو `.github/workflows/*.yml` من AAB وإصلاح مرجع `url`) |
| بناء واجهة الويب + فحص TypeScript (`compile_applet` + `lint_applet`) | نجح (`tsc --noEmit` + `vite build`) | أدوات البناء المحلية |
| `:app:testDebugUnitTest :wear:testDebugUnitTest lint :app:assembleRelease :wear:assembleRelease` + `zipalign` + `apksigner` + `verify_release_apk.py` | **لم يُنفّذ محليًا** (بانتظار GitHub Actions CI لعدم توفر Android SDK/Gradle في هذه البيئة) | يشتغل تلقائيًا عبر `.github/workflows/build.yml` و`.github/workflows/build-apk.yml` عند الدفع إلى المستودع (Release APK فقط) |
