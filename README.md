# AstraIDE — Lightweight Android Development Environment for Windows

[![Windows 10/11 x64](https://img.shields.io/badge/Platform-Windows%2010%2F11%20x64-blue.svg)](https://microsoft.com/windows)
[![Core: Rust](https://img.shields.io/badge/Core-Rust%202021-orange.svg)](https://www.rust-lang.org)
[![Shell: Tauri 2](https://img.shields.io/badge/Shell-Tauri%202.x-24C8D8.svg)](https://tauri.app)
[![Editor: CodeMirror 6](https://img.shields.io/badge/Editor-CodeMirror%206-black.svg)](https://codemirror.net)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **A fast, modular Android development environment for Windows, powered by Rust.**

---

## 1. What is AstraIDE?

**AstraIDE** is a fast, lightweight alternative Android development environment designed for Windows. Unlike heavyweight traditional IDEs that can consume 3–6 GB of idle memory and take minutes to start, AstraIDE focuses on:

- **Low idle resource usage** (~180–220 MB RAM vs 3,000+ MB)
- **Sub-second startup time**
- **Modular Android tooling**
- **Direct physical Android device development via USB/Wi-Fi**
- **Real-time Logcat and integrated Windows Terminal**
- **Direct Gradle build streaming and APK inspection**

AstraIDE is **not** an Android compiler itself; it provides a clean, responsive developer interface around the official Android toolchain installed on your machine (Java JDK, Android SDK, Gradle, ADB, and Build Tools).

---

## 2. Architecture & Tech Stack

```text
AstraIDE
│
├── Rust Core (src-tauri/src/core/)
│   ├── env_detector.rs      # Real workstation inspection (JDK, SDK, ADB, Git, CPU, RAM)
│   ├── sdk_manager.rs       # Platforms, build-tools, component disk sizing
│   ├── adb_client.rs        # Device detection, USB/Emulator state, APK installer, screenshot
│   ├── gradle_runner.rs     # gradlew.bat execution, line streaming, APK discovery
│   ├── logcat_streamer.rs   # Async adb logcat streaming with threadtime parsing
│   ├── project_generator.rs # Generates real, buildable Gradle Android projects
│   ├── project_tree.rs      # Filesystem tree with .git/.gradle/build ignore filters
│   ├── apk_analyzer.rs      # ZIP analysis of DEX count, ABIs, manifest badging
│   ├── storage_analyzer.rs  # Disk analysis of SDK, Gradle cache, build directories
│   ├── resource_monitor.rs  # Live CPU, RAM, Disk, and process footprint
│   ├── terminal_session.rs  # Real PowerShell & CMD command runner
│   ├── git_client.rs        # Git status, stage, commit, diff viewer
│   └── config_store.rs      # Settings & recent projects persistence
│
├── Desktop Shell
│   └── Tauri 2.x            # Native Windows WebView2 shell (No Electron bloat)
│
└── Frontend (src/)
    ├── Code Editor          # CodeMirror 6 (Kotlin, Java, XML, Gradle, JSON, Rust)
    ├── Welcome Screen       # Environment diagnostics, recent projects, device summary
    ├── Project Explorer     # Expandable tree with file actions & reveal in Explorer
    ├── Build Panel          # Live Gradle streaming, assembleDebug, assembleRelease, clean
    ├── Device Manager       # Physical & emulator devices, screenshot, run & deploy
    ├── Logcat Viewer        # Virtualized log stream with level filtering (V/D/I/W/E/F)
    ├── Terminal             # Integrated PowerShell / CMD with project working directory
    ├── SDK Manager          # Platforms & build-tools inspection
    ├── APK Analyzer         # DEX files, native .so ABIs, permissions, version codes
    ├── Storage Analyzer     # Android footprint breakdown & safe cleanup
    ├── Resource Monitor     # Real-time hardware utilization gauges
    ├── Git Panel            # Branch, changed files, staging, diffs, and commits
    └── Command Palette      # Ctrl+Shift+P quick actions
```

---

## 3. Supported Android Workflows

1. **Project Creation**
   - Templates: Empty Activity, Basic Activity
   - Languages: Kotlin (JVM 17), Java
   - Automatic configuration of `settings.gradle`, `build.gradle`, `gradle-wrapper.properties`, `gradlew.bat`, `local.properties`, `AndroidManifest.xml`, resources, and themes.
2. **Editing**
   - Syntax highlighting for Kotlin (`.kt`), Java (`.java`), XML layout and manifest (`.xml`), Gradle (`.gradle`), JSON, Markdown, Rust.
   - Tabs, dirty file indicators, line numbers, bracket matching, word wrap toggle.
3. **Gradle Builds**
   - Prefers project `gradlew.bat` wrapper.
   - Live stdout/stderr log streaming.
   - Detection of resulting APKs (`app/build/outputs/apk/debug/app-debug.apk`).
4. **Device Deployment**
   - Real-time ADB device detection over USB and Wi-Fi.
   - Handles unauthorized state with guidance.
   - 1-click Build + Deploy + Logcat launch.
   - Device screen capture / screenshot preview.
5. **Logcat Monitoring**
   - Streams `adb logcat -v threadtime`.
   - Filter by log level: `VERBOSE`, `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`.
   - Real-time search by tag, package, PID, or message text.
   - Export filtered logs to file.
6. **APK Inspection**
   - Open any `.apk` file.
   - Inspect compressed vs uncompressed size, compression ratio.
   - Counts DEX files and DEX byte sizes.
   - Identifies native libraries (`arm64-v8a`, `armeabi-v7a`, `x86_64`).
   - Extracts manifest package name, versionCode, versionName, permissions, and activities.
7. **Diagnostics & Storage**
   - Inspects disk consumed by SDK, Gradle cache (`~/.gradle/caches`), emulator snapshots, and active project build folders.
   - Safe cleanup action for intermediate build outputs.

---

## 4. Development & Build Setup

### Prerequisites

- **Windows 10 / 11 (64-bit)**
- **Rust toolchain**: 1.75+ (`rustc`, `cargo`)
- **Node.js**: v18+ (Node 20 or 24 recommended)
- **Java JDK**: JDK 17 or 21 (Eclipse Adoptium Temurin or Oracle JDK)
- **Android SDK**: With `platform-tools` (`adb.exe`) and `build-tools`

### Installation

```bash
# Clone the repository
git clone https://github.com/example/astraide.git
cd astraide

# Install frontend dependencies
npm install
```

### Running in Development

```bash
# Run AstraIDE in dev mode with hot reloading:
npm run tauri dev
```

### Building Windows Release

```bash
# Build standalone release executable:
npm run tauri build
```
The output executable will be created in:
`src-tauri/target/release/AstraIDE.exe`

### Running Tests

```bash
# Run Rust unit and integration tests:
cd src-tauri
cargo test
```

---

## 5. Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl+Shift+P` | Open Command Palette |
| `Ctrl+S` | Save active file |
| `Ctrl+Shift+S` | Save all open files |
| `F5` | Build and Run on selected device |
| `Ctrl+F` | Find in editor |
| `Ctrl+W` | Close active editor tab |

---

## 6. Known Limitations

- AstraIDE is designed as a **lightweight** alternative, not an exact replica of Android Studio.
- Does not embed IntelliJ-style heavy background AST indexing or Kotlin language server refactorings by design to maintain low RAM usage.
- Uses the Gradle command-line daemon and official Android toolchain; builds will take the standard duration required by Gradle for your hardware.
- Priority is given to physical USB device debugging. Virtual emulators (`emulator.exe`) can be started if configured in the SDK, but physical hardware is recommended for optimal system responsiveness.

---

## 7. Security & Offline Guarantee

- **No Remote Code Uploads**: AstraIDE never uploads your code, keystores, or build outputs to external servers.
- **Offline First**: AstraIDE operates completely offline without an internet connection once dependencies are cached.
- **Safe Process Invocation**: All process calls to Gradle, ADB, and Git use structured process arguments rather than raw string shell evaluation.

---

## 8. License

Licensed under the MIT License.
