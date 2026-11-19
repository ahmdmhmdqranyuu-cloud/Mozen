-keep class com.muslim.azan.wear.** { *; }
-keepclassmembers class * extends android.app.Activity { *; }

-keepattributes RuntimeVisibleAnnotations,RuntimeVisibleParameterAnnotations,AnnotationDefault,Signature,InnerClasses,EnclosingMethod,Exceptions
-keep class kotlin.Metadata { *; }
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}

-keepclassmembers class * implements android.location.LocationListener { *; }
-keepclassmembers class * implements android.media.MediaPlayer$OnCompletionListener { *; }
-keepclassmembers class * implements android.media.AudioManager$OnAudioFocusChangeListener { *; }

-dontwarn androidx.compose.**
-dontwarn androidx.wear.**
-dontwarn org.codehaus.mojo.animal_sniffer.**
-dontwarn com.google.errorprone.annotations.**
-dontwarn javax.annotation.**
-dontwarn org.checkerframework.**
-dontwarn java.lang.ClassValue
-dontwarn sun.misc.**
