# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Principles in AstraIDE

1. **No Silent Elevation**: AstraIDE runs with standard user privileges. It never asks for or elevates Administrator permissions without user initiation.
2. **Offline-First & Local Only**: AstraIDE does not collect, transmit, or synchronize project source code, keystores, or build artifacts with external servers.
3. **Structured Process Execution**: Subprocess calls (Gradle, ADB, Git) use explicit argument lists rather than raw constructed shell strings to prevent command injection vulnerabilities.
4. **Filesystem Boundaries**: Destructive filesystem actions require explicit confirmation and cannot escape safe boundaries.

## Reporting a Vulnerability

If you discover a security vulnerability within AstraIDE, please send an advisory to `security@astraide.dev` rather than opening a public issue. We appreciate responsible disclosure and respond promptly.
