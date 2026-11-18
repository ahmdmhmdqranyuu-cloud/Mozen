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

# Keep data models serialized with Gson & org.json
-keepclassmembers class com.muslim.azan.model.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class com.google.gson.reflect.TypeToken { *; }
-keep class * extends com.google.gson.reflect.TypeToken
-keep class org.json.** { *; }

# Google Play Services Location
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# AndroidX, WorkManager, Media & Compose rules
-keep class androidx.compose.** { *; }
-keep class androidx.lifecycle.** { *; }
-keep class androidx.media.** { *; }
-keep class androidx.work.** { *; }
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
-dontwarn androidx.compose.**
-dontwarn sun.misc.Unsafe
-dontwarn java.lang.invoke.StringConcatFactory
