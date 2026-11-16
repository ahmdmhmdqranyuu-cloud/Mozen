# Application classes & native services/receivers
-keep class com.muslim.azan.** { *; }
-keepclassmembers class * extends android.content.BroadcastReceiver { *; }
-keepclassmembers class * extends android.app.Service { *; }
-keepclassmembers class * extends android.app.Activity { *; }

# Keep Kotlin metadata & Coroutines (essential for Compose & reflection)
-keepattributes RuntimeVisibleAnnotations,AnnotationDefault,Signature,InnerClasses,EnclosingMethod
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

# AndroidX, Media & Compose rules
-keep class androidx.compose.** { *; }
-keep class androidx.lifecycle.** { *; }
-keep class androidx.media.** { *; }
-dontwarn androidx.compose.**
-dontwarn sun.misc.Unsafe
-dontwarn java.lang.invoke.StringConcatFactory
