# Application classes & native services/receivers/workers
-keep class com.muslim.azan.** { *; }
-keep class com.muslim.azan.service.QuranPlaybackService { *; }
-keep class com.muslim.azan.service.RecitationUploadWorker { *; }
-keep class com.muslim.azan.service.VolumeKeyStopPolicy { *; }
-keepclassmembers class * extends android.content.BroadcastReceiver { *; }
-keepclassmembers class * extends android.app.Service { *; }
-keepclassmembers class * extends android.app.Activity { *; }

# Keep Kotlin metadata & Coroutines (essential for Compose & reflection)
-keepattributes RuntimeVisibleAnnotations,RuntimeVisibleParameterAnnotations,AnnotationDefault,Signature,InnerClasses,EnclosingMethod,Exceptions
-keep class kotlin.Metadata { *; }
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}

# Keep data models & JSON / Gson serialization under R8 fullMode
-keep class com.muslim.azan.model.** { *; }
-keepclassmembers class com.muslim.azan.model.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class com.google.gson.reflect.TypeToken { *; }
-keep class * extends com.google.gson.reflect.TypeToken
-keep class org.json.** { *; }

# WorkManager Worker constructors (consumer rules from AndroidX handle internals safely)
-keep public class * extends androidx.work.Worker {
    public <init>(android.content.Context, androidx.work.WorkerParameters);
}
-keep public class * extends androidx.work.CoroutineWorker {
    public <init>(android.content.Context, androidx.work.WorkerParameters);
}
-keep public class * extends androidx.work.ListenableWorker {
    public <init>(android.content.Context, androidx.work.WorkerParameters);
}
-keepnames class androidx.work.impl.background.systemalarm.**
-keepnames class androidx.work.impl.background.systemjob.**

# Location Services (Google Play Services Location + Android Geocoder & LocationListener callbacks)
-keep class com.google.android.gms.location.** { *; }
-keep class com.google.android.gms.tasks.** { *; }
-keep class com.google.android.gms.common.api.** { *; }
-keepclassmembers class * implements android.location.LocationListener { *; }
-keepclassmembers class * implements android.location.Geocoder$GeocodeListener { *; }

# Media Playback & Audio Focus (androidx.media, MediaPlayer & AudioManager callbacks)
-keep class androidx.media.** { *; }
-keep class android.support.v4.media.** { *; }
-keep class com.muslim.azan.service.** { *; }
-keepclassmembers class * implements android.media.MediaPlayer$OnPreparedListener { *; }
-keepclassmembers class * implements android.media.MediaPlayer$OnCompletionListener { *; }
-keepclassmembers class * implements android.media.MediaPlayer$OnErrorListener { *; }
-keepclassmembers class * implements android.media.AudioManager$OnAudioFocusChangeListener { *; }

# Google Play Services Location & optional compile-only annotations under R8 fullMode
-dontwarn com.google.android.gms.**
-dontwarn androidx.compose.**
-dontwarn androidx.work.**
-dontwarn androidx.media.**
-dontwarn org.codehaus.mojo.animal_sniffer.**
-dontwarn com.google.errorprone.annotations.**
-dontwarn javax.annotation.**
-dontwarn org.checkerframework.**
-dontwarn java.lang.ClassValue
-dontwarn java.lang.instrument.**
-dontwarn sun.misc.**
-dontwarn java.lang.invoke.StringConcatFactory
