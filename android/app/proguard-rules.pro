# Application classes
-keep class com.muslim.azan.** { *; }

# Keep data models serialized with Gson
-keepclassmembers class com.muslim.azan.model.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# AndroidX and Compose rules
-keep class androidx.compose.** { *; }
-keep class androidx.lifecycle.** { *; }
-dontwarn androidx.compose.**
