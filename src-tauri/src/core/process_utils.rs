#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

pub const CREATE_NO_WINDOW: u32 = 0x08000000;

/// Creates a std::process::Command configured to never pop up or flash a console window on Windows.
pub fn hidden_command(program: impl AsRef<std::ffi::OsStr>) -> std::process::Command {
    #[allow(unused_mut)]
    let mut cmd = std::process::Command::new(program);
    #[cfg(target_os = "windows")]
    {
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    cmd
}

/// Creates a tokio::process::Command configured to never pop up or flash a console window on Windows.
pub fn hidden_tokio_command(program: impl AsRef<std::ffi::OsStr>) -> tokio::process::Command {
    #[allow(unused_mut)]
    let mut cmd = tokio::process::Command::new(program);
    #[cfg(target_os = "windows")]
    {
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    cmd
}
