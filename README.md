# مسلم بلس — Muslim Plus (Android & Wear OS)

[![Android & Wear OS Release Build](../../actions/workflows/build.yml/badge.svg)](../../actions/workflows/build.yml)

تطبيق إسلامي شامل متوافق مع **Android 15 و Android 16** وساعات **Wear OS** الذكية.

## أبرز المميزات
- **مواقيت الصلاة الدقيقة**: حسابات فلكية متوافقة تمامًا مع التوقيت الصيفي والتعديلات اليدوية لكل صلاة (`PrayerTimeCalculator.java` و `WearPrayerTimesCalculator.kt`).
- **الأذان والتنبيهات الدقيقة**: جدولة دقيقة عبر `AlarmManager.setAlarmClock` مع خدمة صوتية موحدة (`AzkarAudioService`) تدعم التركيز الصوتي وقائمة انتظار FIFO ونافذة تنبيه على شاشة القفل.
- **معالج الإعداد السريع لأول مرة**: اختيار المدينة أو GPS، وتفعيل أذونات المنبهات الدقيقة، والإشعارات، واستثناء البطارية، واختبار صوت الأذان من أول تشغيل.
- **القرآن الكريم والتلاوات والأذكار**: المصحف الشريف، التفسير الميسر، التسميع الذكي، الأذكار اليومية، السبحة، القبلة، الحج، الزكاة، ورمضان.
- **دعم ساعات Wear OS (`:wear`)**: عرض مواقيت الصلاة واتجاه القبلة والأوقات الشرعية الليلية على الساعة الذكية دون اتصال بالإنترنت.

## البناء والتوقيع (Gradle & CI/CD)
- يتم إدارة توقيع Release/Debug مركزيًا عبر [`android/signing.gradle`](android/signing.gradle).
- لعرض حالة متغيرات البيئة دون كشف الأسرار:
  ```bash
  cd android
  ./gradlew :printBuildEnvironment :app:printSigningEnv :wear:printSigningEnv
  ```
- لبناء حزم Release APK للهاتف والساعة:
  ```bash
  cd android
  ./gradlew :app:assembleRelease :wear:assembleRelease
  ```
  *(إذا لم يتم تمرير `KEYSTORE_FILE` أو كلمات المرور، يكمل البناء تلقائيًا دون فشل؛ وفي GitHub Actions يتم توليد شهادة إصدار PKCS12 تلقائيًا عند عدم ضبط الأسرار).*
