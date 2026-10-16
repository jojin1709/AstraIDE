use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    pub package_name: String,
    pub location: String,
    pub min_sdk: u32,
    pub target_sdk: u32,
    pub language: String, // "kotlin" or "java"
    pub template: String, // "empty", "basic", "compose"
    pub custom_sdk_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProjectResponse {
    pub success: bool,
    pub project_path: String,
    pub message: String,
}

pub struct ProjectGenerator;

impl ProjectGenerator {
    pub fn create_project(req: &CreateProjectRequest) -> Result<CreateProjectResponse, String> {
        let base_dir = Path::new(&req.location);
        let project_dir = base_dir.join(&req.name);

        if project_dir.exists() {
            let entries = fs::read_dir(&project_dir).map_err(|e| e.to_string())?;
            if entries.count() > 0 {
                return Err(format!(
                    "Directory already exists and is not empty: {}",
                    project_dir.display()
                ));
            }
        }

        fs::create_dir_all(&project_dir).map_err(|e| format!("Failed to create project folder: {}", e))?;

        let is_kotlin = req.language.to_lowercase() == "kotlin";
        let package_path_rel = req.package_name.replace('.', "/");

        // 1. settings.gradle
        let settings_gradle = format!(
            r#"pluginManagement {{
    repositories {{
        google()
        mavenCentral()
        gradlePluginPortal()
    }}
}}
dependencyResolutionManagement {{
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {{
        google()
        mavenCentral()
    }}
}}

rootProject.name = "{name}"
include ':app'
"#,
            name = req.name
        );
        fs::write(project_dir.join("settings.gradle"), settings_gradle)
            .map_err(|e| format!("Failed writing settings.gradle: {}", e))?;

        // 2. root build.gradle
        let kotlin_plugin = if is_kotlin {
            "    id 'org.jetbrains.kotlin.android' version '1.9.24' apply false\n"
        } else {
            ""
        };
        let root_build_gradle = format!(
            r#"// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {{
    id 'com.android.application' version '8.5.2' apply false
    id 'com.android.library' version '8.5.2' apply false
{kotlin_plugin}}}
task clean(type: Delete) {{
    delete rootProject.buildDir
}}
"#,
            kotlin_plugin = kotlin_plugin
        );
        fs::write(project_dir.join("build.gradle"), root_build_gradle)
            .map_err(|e| format!("Failed writing root build.gradle: {}", e))?;

        // 3. gradle.properties
        let gradle_properties = r#"org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
"#;
        fs::write(project_dir.join("gradle.properties"), gradle_properties)
            .map_err(|e| format!("Failed writing gradle.properties: {}", e))?;

        // 4. gradle/wrapper/gradle-wrapper.properties
        let wrapper_dir = project_dir.join("gradle").join("wrapper");
        fs::create_dir_all(&wrapper_dir).map_err(|e| format!("Failed creating wrapper dir: {}", e))?;

        let wrapper_properties = r#"distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.7-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
"#;
        fs::write(wrapper_dir.join("gradle-wrapper.properties"), wrapper_properties)
            .map_err(|e| format!("Failed writing gradle-wrapper.properties: {}", e))?;

        // 5. gradlew.bat
        let gradlew_bat_content = Self::get_gradlew_bat_content();
        fs::write(project_dir.join("gradlew.bat"), gradlew_bat_content)
            .map_err(|e| format!("Failed writing gradlew.bat: {}", e))?;

        // 6. local.properties if SDK path is provided or detected
        if let Some(sdk) = &req.custom_sdk_path {
            let escaped_sdk = sdk.replace('\\', "\\\\").replace(':', "\\:");
            let local_props = format!("sdk.dir={}\n", escaped_sdk);
            let _ = fs::write(project_dir.join("local.properties"), local_props);
        } else if let Ok(sdk_env) = std::env::var("ANDROID_HOME") {
            let escaped_sdk = sdk_env.replace('\\', "\\\\").replace(':', "\\:");
            let local_props = format!("sdk.dir={}\n", escaped_sdk);
            let _ = fs::write(project_dir.join("local.properties"), local_props);
        }

        // 7. .gitignore
        let gitignore = r#"*.iml
.gradle
/local.properties
/.idea/
.DS_Store
/build
/captures
.externalNativeBuild
.cxx
*.apk
*.aab
"#;
        fs::write(project_dir.join(".gitignore"), gitignore)
            .map_err(|e| format!("Failed writing .gitignore: {}", e))?;

        // 8. app module
        let app_dir = project_dir.join("app");
        let src_main = app_dir.join("src").join("main");
        let code_dir = if is_kotlin {
            src_main.join("java").join(&package_path_rel)
        } else {
            src_main.join("java").join(&package_path_rel)
        };
        fs::create_dir_all(&code_dir).map_err(|e| format!("Failed creating code dir: {}", e))?;

        let res_layout = src_main.join("res").join("layout");
        let res_values = src_main.join("res").join("values");
        fs::create_dir_all(&res_layout).map_err(|e| format!("Failed creating res layout: {}", e))?;
        fs::create_dir_all(&res_values).map_err(|e| format!("Failed creating res values: {}", e))?;

        // app/build.gradle
        let kotlin_plugin_apply = if is_kotlin {
            "    id 'org.jetbrains.kotlin.android'\n"
        } else {
            ""
        };
        let kotlin_options = if is_kotlin {
            r#"    kotlinOptions {
        jvmTarget = '17'
    }
"#
        } else {
            ""
        };

        let app_build_gradle = format!(
            r#"plugins {{
    id 'com.android.application'
{kotlin_plugin_apply}}}

android {{
    namespace '{package_name}'
    compileSdk {target_sdk}

    defaultConfig {{
        applicationId '{package_name}'
        minSdk {min_sdk}
        targetSdk {target_sdk}
        versionCode 1
        versionName "1.0"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }}

    buildTypes {{
        release {{
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }}
    }}
    compileOptions {{
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }}
{kotlin_options}}}

dependencies {{
    implementation 'androidx.core:core-ktx:1.13.1'
    implementation 'androidx.appcompat:appcompat:1.7.0'
    implementation 'com.google.android.material:material:1.12.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.2.1'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.6.1'
}}
"#,
            package_name = req.package_name,
            min_sdk = req.min_sdk,
            target_sdk = req.target_sdk,
            kotlin_plugin_apply = kotlin_plugin_apply,
            kotlin_options = kotlin_options
        );
        fs::write(app_dir.join("build.gradle"), app_build_gradle)
            .map_err(|e| format!("Failed writing app/build.gradle: {}", e))?;

        // app/proguard-rules.pro
        fs::write(app_dir.join("proguard-rules.pro"), "# Add project specific ProGuard rules here\n")
            .map_err(|e| format!("Failed writing proguard-rules.pro: {}", e))?;

        // app/src/main/AndroidManifest.xml
        let manifest = format!(
            r#"<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher"
        android:supportsRtl="true"
        android:theme="@style/Theme.{name}">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
"#,
            name = req.name.replace(' ', "")
        );
        fs::write(src_main.join("AndroidManifest.xml"), manifest)
            .map_err(|e| format!("Failed writing AndroidManifest.xml: {}", e))?;

        // Activity code
        if is_kotlin {
            let activity_kt = format!(
                r#"package {package_name}

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {{

    private var clickCount = 0

    override fun onCreate(savedInstanceState: Bundle?) {{
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val titleView = findViewById<TextView>(R.id.tv_title)
        val button = findViewById<Button>(R.id.btn_action)

        button.setOnClickListener {{
            clickCount++
            titleView.text = "AstraIDE: Clicked $clickCount times"
            Toast.makeText(this, "AstraIDE Android App Active!", Toast.LENGTH_SHORT).show()
        }}
    }}
}}
"#,
                package_name = req.package_name
            );
            fs::write(code_dir.join("MainActivity.kt"), activity_kt)
                .map_err(|e| format!("Failed writing MainActivity.kt: {}", e))?;
        } else {
            let activity_java = format!(
                r#"package {package_name};

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {{

    private int clickCount = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {{
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        TextView titleView = findViewById(R.id.tv_title);
        Button button = findViewById(R.id.btn_action);

        button.setOnClickListener(new View.OnClickListener() {{
            @Override
            public void onClick(View v) {{
                clickCount++;
                titleView.setText("AstraIDE: Clicked " + clickCount + " times");
                Toast.makeText(MainActivity.this, "AstraIDE Android App Active!", Toast.LENGTH_SHORT).show();
            }}
        }});
    }}
}}
"#,
                package_name = req.package_name
            );
            fs::write(code_dir.join("MainActivity.java"), activity_java)
                .map_err(|e| format!("Failed writing MainActivity.java: {}", e))?;
        }

        // res/layout/activity_main.xml
        let layout_xml = format!(
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n\
<androidx.constraintlayout.widget.ConstraintLayout\n\
    xmlns:android=\"http://schemas.android.com/apk/res/android\"\n\
    xmlns:app=\"http://schemas.android.com/apk/res-auto\"\n\
    xmlns:tools=\"http://schemas.android.com/tools\"\n\
    android:layout_width=\"match_parent\"\n\
    android:layout_height=\"match_parent\"\n\
    android:background=\"#0F172A\"\n\
    android:padding=\"24dp\">\n\n\
    <TextView\n\
        android:id=\"@+id/tv_title\"\n\
        android:layout_width=\"wrap_content\"\n\
        android:layout_height=\"wrap_content\"\n\
        android:text=\"{name}\"\n\
        android:textColor=\"#38BDF8\"\n\
        android:textSize=\"28sp\"\n\
        android:textStyle=\"bold\"\n\
        app:layout_constraintBottom_toTopOf=\"@id/tv_subtitle\"\n\
        app:layout_constraintEnd_toEndOf=\"parent\"\n\
        app:layout_constraintStart_toStartOf=\"parent\"\n\
        app:layout_constraintTop_toTopOf=\"parent\"\n\
        app:layout_constraintVertical_chainStyle=\"packed\" />\n\n\
    <TextView\n\
        android:id=\"@+id/tv_subtitle\"\n\
        android:layout_width=\"wrap_content\"\n\
        android:layout_height=\"wrap_content\"\n\
        android:layout_marginTop=\"8dp\"\n\
        android:text=\"Built with AstraIDE Lightweight Environment\"\n\
        android:textColor=\"#94A3B8\"\n\
        android:textSize=\"14sp\"\n\
        app:layout_constraintBottom_toTopOf=\"@id/btn_action\"\n\
        app:layout_constraintEnd_toEndOf=\"parent\"\n\
        app:layout_constraintStart_toStartOf=\"parent\"\n\
        app:layout_constraintTop_toBottomOf=\"@id/tv_title\" />\n\n\
    <Button\n\
        android:id=\"@+id/btn_action\"\n\
        android:layout_width=\"wrap_content\"\n\
        android:layout_height=\"wrap_content\"\n\
        android:layout_marginTop=\"24dp\"\n\
        android:backgroundTint=\"#0284C7\"\n\
        android:text=\"Test Interaction\"\n\
        android:textColor=\"#FFFFFF\"\n\
        app:layout_constraintBottom_toBottomOf=\"parent\"\n\
        app:layout_constraintEnd_toEndOf=\"parent\"\n\
        app:layout_constraintStart_toStartOf=\"parent\"\n\
        app:layout_constraintTop_toBottomOf=\"@id/tv_subtitle\" />\n\n\
</androidx.constraintlayout.widget.ConstraintLayout>\n",
            name = req.name
        );
        fs::write(res_layout.join("activity_main.xml"), layout_xml)
            .map_err(|e| format!("Failed writing activity_main.xml: {}", e))?;

        // res/values/strings.xml
        let strings_xml = format!(
            r#"<resources>
    <string name="app_name">{}</string>
</resources>
"#,
            req.name
        );
        fs::write(res_values.join("strings.xml"), strings_xml)
            .map_err(|e| format!("Failed writing strings.xml: {}", e))?;

        // res/values/colors.xml
        let colors_xml = r#"<resources>
    <color name="purple_200">#FFBB86FC</color>
    <color name="purple_500">#FF6200EE</color>
    <color name="purple_700">#FF3700B3</color>
    <color name="teal_200">#FF03DAC5</color>
    <color name="teal_700">#FF018786</color>
    <color name="black">#FF000000</color>
    <color name="white">#FFFFFFFF</color>
</resources>
"#;
        fs::write(res_values.join("colors.xml"), colors_xml)
            .map_err(|e| format!("Failed writing colors.xml: {}", e))?;

        // res/values/themes.xml
        let clean_name = req.name.replace(' ', "");
        let themes_xml = format!(
            r#"<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.{clean_name}" parent="Theme.MaterialComponents.DayNight.DarkActionBar">
        <item name="colorPrimary">@color/purple_500</item>
        <item name="colorPrimaryVariant">@color/purple_700</item>
        <item name="colorOnPrimary">@color/white</item>
        <item name="colorSecondary">@color/teal_200</item>
        <item name="colorSecondaryVariant">@color/teal_700</item>
        <item name="colorOnSecondary">@color/black</item>
        <item name="android:statusBarColor">?attr/colorPrimaryVariant</item>
    </style>
</resources>
"#,
            clean_name = clean_name
        );
        fs::write(res_values.join("themes.xml"), themes_xml)
            .map_err(|e| format!("Failed writing themes.xml: {}", e))?;

        Ok(CreateProjectResponse {
            success: true,
            project_path: project_dir.to_string_lossy().to_string(),
            message: format!("Android project '{}' generated successfully.", req.name),
        })
    }

    fn get_gradlew_bat_content() -> &'static str {
        r#"@rem
@rem Copyright 2015 the original author or authors.
@rem
@rem Licensed under the Apache License, Version 2.0 (the "License");
@rem you may not use this file except in compliance with the License.
@rem You may obtain a copy of the License at
@rem
@rem      https://www.apache.org/licenses/LICENSE-2.0
@rem
@if "%DEBUG%" == "" @echo off
@rem ##########################################################################
@rem
@rem  Gradle startup script for Windows
@rem
@rem ##########################################################################

@rem Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal

set DIRNAME=%~dp0
if "%DIRNAME%" == "" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%

@rem Resolve any "." and ".." in APP_HOME to make it shorter.
for %%i in ("%APP_HOME%") do set APP_HOME=%%~fi

@rem Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.
set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"

@rem Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if "%ERRORLEVEL%" == "0" goto execute

echo.
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
echo.
goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/java.exe

if exist "%JAVA_EXE%" goto execute

echo.
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
echo.
goto fail

:execute
@rem Setup the command line

set CLASSPATH=%APP_HOME%\gradle\wrapper\gradle-wrapper.jar

@rem If wrapper jar exists, execute it
if exist "%CLASSPATH%" (
    "%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*
    goto end
)

@rem Otherwise fallback to system gradle if available
where gradle >nul 2>nul
if %ERRORLEVEL% equ 0 (
    gradle %*
    goto end
)

echo ERROR: gradle-wrapper.jar not found and system gradle is not in PATH.
echo Please run 'gradle wrapper' once or install Gradle.
goto fail

:fail
exit /b 1

:end
if "%OS%"=="Windows_NT" endlocal
"#
    }
}
