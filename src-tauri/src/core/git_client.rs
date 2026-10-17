use crate::core::process_utils::hidden_command;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitFileStatus {
    pub path: String,
    pub status: String, // "M", "A", "D", "??", etc.
    pub is_staged: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitCommitSummary {
    pub hash: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitRepoStatus {
    pub is_repo: bool,
    pub current_branch: Option<String>,
    pub files: Vec<GitFileStatus>,
    pub recent_commits: Vec<GitCommitSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitDiffResult {
    pub file_path: String,
    pub diff: String,
}

pub struct GitClient;

impl GitClient {
    pub fn get_status(project_path: &str) -> Result<GitRepoStatus, String> {
        let p = Path::new(project_path);
        if !p.exists() {
            return Err("Project directory not found".to_string());
        }

        // Check is_inside_work_tree
        let check = hidden_command("git")
            .current_dir(p)
            .args(["rev-parse", "--is-inside-work-tree"])
            .output();

        if check.is_err() || !check.as_ref().unwrap().status.success() {
            return Ok(GitRepoStatus {
                is_repo: false,
                current_branch: None,
                files: Vec::new(),
                recent_commits: Vec::new(),
            });
        }

        // Get current branch
        let mut current_branch = None;
        if let Ok(out) = hidden_command("git")
            .current_dir(p)
            .args(["rev-parse", "--abbrev-ref", "HEAD"])
            .output()
        {
            if out.status.success() {
                let b = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if !b.is_empty() {
                    current_branch = Some(b);
                }
            }
        }

        // Get status porcelain
        let mut files = Vec::new();
        if let Ok(out) = hidden_command("git")
            .current_dir(p)
            .args(["status", "--porcelain=v1"])
            .output()
        {
            if out.status.success() {
                let text = String::from_utf8_lossy(&out.stdout);
                for line in text.lines() {
                    if line.len() >= 3 {
                        let x = line.chars().next().unwrap_or(' ');
                        let y = line.chars().nth(1).unwrap_or(' ');
                        let file_path = line[3..].trim().to_string();

                        let is_staged = x != ' ' && x != '?';
                        let status_str = format!("{}{}", x, y).trim().to_string();

                        files.push(GitFileStatus {
                            path: file_path,
                            status: status_str,
                            is_staged,
                        });
                    }
                }
            }
        }

        // Get recent commits
        let mut recent_commits = Vec::new();
        if let Ok(out) = hidden_command("git")
            .current_dir(p)
            .args(["log", "-n", "10", "--oneline"])
            .output()
        {
            if out.status.success() {
                let text = String::from_utf8_lossy(&out.stdout);
                for line in text.lines() {
                    let mut parts = line.splitn(2, ' ');
                    if let Some(hash) = parts.next() {
                        let msg = parts.next().unwrap_or("").to_string();
                        recent_commits.push(GitCommitSummary {
                            hash: hash.to_string(),
                            message: msg,
                        });
                    }
                }
            }
        }

        Ok(GitRepoStatus {
            is_repo: true,
            current_branch,
            files,
            recent_commits,
        })
    }

    pub fn stage_file(project_path: &str, file_path: &str) -> Result<(), String> {
        let out = hidden_command("git")
            .current_dir(project_path)
            .args(["add", file_path])
            .output()
            .map_err(|e| format!("Failed to stage file: {}", e))?;

        if !out.status.success() {
            return Err(String::from_utf8_lossy(&out.stderr).to_string());
        }
        Ok(())
    }

    pub fn unstage_file(project_path: &str, file_path: &str) -> Result<(), String> {
        let out = hidden_command("git")
            .current_dir(project_path)
            .args(["reset", "HEAD", file_path])
            .output()
            .map_err(|e| format!("Failed to unstage file: {}", e))?;

        if !out.status.success() {
            return Err(String::from_utf8_lossy(&out.stderr).to_string());
        }
        Ok(())
    }

    pub fn commit(project_path: &str, message: &str) -> Result<String, String> {
        let out = hidden_command("git")
            .current_dir(project_path)
            .args(["commit", "-m", message])
            .output()
            .map_err(|e| format!("Failed to commit: {}", e))?;

        if !out.status.success() {
            return Err(String::from_utf8_lossy(&out.stderr).to_string());
        }
        Ok(String::from_utf8_lossy(&out.stdout).to_string())
    }

    pub fn get_diff(project_path: &str, file_path: &str) -> Result<GitDiffResult, String> {
        let mut diff_str = String::new();

        // Check working tree diff
        if let Ok(out) = hidden_command("git")
            .current_dir(project_path)
            .args(["diff", file_path])
            .output()
        {
            if out.status.success() {
                diff_str = String::from_utf8_lossy(&out.stdout).to_string();
            }
        }

        // If empty, check staged diff
        if diff_str.is_empty() {
            if let Ok(out) = hidden_command("git")
                .current_dir(project_path)
                .args(["diff", "--cached", file_path])
                .output()
            {
                if out.status.success() {
                    diff_str = String::from_utf8_lossy(&out.stdout).to_string();
                }
            }
        }

        Ok(GitDiffResult {
            file_path: file_path.to_string(),
            diff: diff_str,
        })
    }
}
