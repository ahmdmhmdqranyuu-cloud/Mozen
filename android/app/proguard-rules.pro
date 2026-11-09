# Keep WebView JavaScriptInterface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keep class com.muslim.azan.** { *; }
