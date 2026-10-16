# AstraIDE Project Website

This directory contains the official static website and documentation portal for **AstraIDE**, configured for automatic deployment via **GitHub Pages**.

- **Live URL**: [https://jojin1709.github.io/AstraIDE/](https://jojin1709.github.io/AstraIDE/)
- **Repository**: [https://github.com/jojin1709/AstraIDE](https://github.com/jojin1709/AstraIDE)
- **Releases**: [https://github.com/jojin1709/AstraIDE/releases](https://github.com/jojin1709/AstraIDE/releases)
- **Developer**: JOJIN JOHN
- **License**: MIT

---

## Directory Structure

```text
docs/
├── index.html               # Semantic HTML5 single-page application & documentation
├── style.css                # Custom CSS styling (Light mode primary, system typography)
├── script.js                # Vanilla JavaScript (Tabs, lightbox, copy buttons, FAQ)
├── README.md                # Deployment and documentation guide
└── assets/
    ├── logo.svg             # AstraIDE light brand mark vector
    ├── favicon.svg          # Browser favicon vector
    ├── icons/               # High-contrast SVG line icons
    │   ├── adb.svg
    │   ├── android.svg
    │   ├── apk.svg
    │   ├── check.svg
    │   ├── codemirror.svg
    │   ├── copy.svg
    │   ├── device.svg
    │   ├── diagnostics.svg
    │   ├── editor.svg
    │   ├── external.svg
    │   ├── git.svg
    │   ├── github.svg
    │   ├── gradle.svg
    │   ├── logcat.svg
    │   ├── react.svg
    │   ├── rust.svg
    │   ├── shield.svg
    │   ├── storage.svg
    │   ├── tauri.svg
    │   ├── terminal.svg
    │   ├── typescript.svg
    │   └── windows.svg
    └── screenshots/         # Real Windows desktop application captures
        ├── astraide-dark.png
        ├── astraide-light.png
        └── astraide-settings.png
```

---

## GitHub Pages Deployment

The site is fully static with zero build steps or server-side requirements:

1. Navigate to repository **Settings** on GitHub.
2. Select **Pages** under the *Code and automation* section.
3. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/docs`
4. Click **Save**. GitHub Pages will automatically publish the site at `https://jojin1709.github.io/AstraIDE/`.

---

## Local Development & Testing

Since all asset links and dependencies are relative (`./`), you can test the site using any local static file server:

```powershell
# Using Python
cd docs
python -m http.server 8080

# Using Node.js npx serve
npx serve docs

# Or simply open index.html directly in any modern browser
```

---

## Design Principles

- **Zero External Dependencies**: Pure HTML5, CSS3, vanilla JS, and inline/local SVG assets. No external CDNs or heavy runtimes.
- **Developer-Focused Restraint**: Clean white and slate aesthetic without AI clichés, giant decorative gradients, or artificial statistics.
- **Subdirectory Compatibility**: All resource links use relative paths (`./`) so the website functions seamlessly under `https://jojin1709.github.io/AstraIDE/`.
