use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileNode {
    pub id: String,
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: Option<u64>,
    pub extension: Option<String>,
    pub children: Option<Vec<FileNode>>,
}

pub struct ProjectTree;

impl ProjectTree {
    const IGNORED_NAMES: &'static [&'static str] = &[
        ".git",
        ".gradle",
        "build",
        ".idea",
        "node_modules",
        "target",
        ".cxx",
        "captures",
    ];

    pub fn read_tree(root_path: &str) -> Result<FileNode, String> {
        let p = Path::new(root_path);
        if !p.exists() {
            return Err(format!("Directory does not exist: {}", root_path));
        }
        let root_name = p
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| root_path.to_string());

        let node = Self::traverse(p, &root_name, 0, 8)?;
        Ok(node)
    }

    fn traverse(path: &Path, name: &str, depth: usize, max_depth: usize) -> Result<FileNode, String> {
        let is_dir = path.is_dir();
        let path_str = path.to_string_lossy().to_string();

        if is_dir {
            let mut children = Vec::new();
            if depth < max_depth {
                if let Ok(entries) = fs::read_dir(path) {
                    let mut dir_entries: Vec<fs::DirEntry> = entries.filter_map(|e| e.ok()).collect();
                    // Sort directories first, then alphabetical
                    dir_entries.sort_by(|a, b| {
                        let a_is_dir = a.file_type().map(|t| t.is_dir()).unwrap_or(false);
                        let b_is_dir = b.file_type().map(|t| t.is_dir()).unwrap_or(false);
                        if a_is_dir != b_is_dir {
                            b_is_dir.cmp(&a_is_dir)
                        } else {
                            a.file_name().cmp(&b.file_name())
                        }
                    });

                    for entry in dir_entries {
                        let child_name = entry.file_name().to_string_lossy().to_string();
                        if Self::IGNORED_NAMES.contains(&child_name.as_str()) {
                            continue;
                        }
                        if let Ok(child_node) = Self::traverse(&entry.path(), &child_name, depth + 1, max_depth) {
                            children.push(child_node);
                        }
                    }
                }
            }

            Ok(FileNode {
                id: path_str.clone(),
                name: name.to_string(),
                path: path_str,
                is_dir: true,
                size: None,
                extension: None,
                children: Some(children),
            })
        } else {
            let ext = path
                .extension()
                .map(|e| e.to_string_lossy().to_string().to_lowercase());
            let size = fs::metadata(path).ok().map(|m| m.len());

            Ok(FileNode {
                id: path_str.clone(),
                name: name.to_string(),
                path: path_str,
                is_dir: false,
                size,
                extension: ext,
                children: None,
            })
        }
    }

    pub fn read_file(path_str: &str) -> Result<String, String> {
        let p = Path::new(path_str);
        if !p.exists() {
            return Err(format!("File does not exist: {}", path_str));
        }
        let meta = fs::metadata(p).map_err(|e| e.to_string())?;
        if meta.len() > 15 * 1024 * 1024 {
            return Err("File exceeds 15 MB maximum editor size limit.".to_string());
        }
        fs::read_to_string(p).map_err(|e| format!("Failed reading file: {}", e))
    }

    pub fn write_file(path_str: &str, content: &str) -> Result<(), String> {
        let p = Path::new(path_str);
        if let Some(parent) = p.parent() {
            if !parent.exists() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
        }
        fs::write(p, content).map_err(|e| format!("Failed saving file: {}", e))
    }

    pub fn create_file(path_str: &str) -> Result<(), String> {
        let p = Path::new(path_str);
        if p.exists() {
            return Err("File already exists.".to_string());
        }
        if let Some(parent) = p.parent() {
            if !parent.exists() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
        }
        fs::write(p, "").map_err(|e| format!("Failed creating file: {}", e))
    }

    pub fn create_directory(path_str: &str) -> Result<(), String> {
        let p = Path::new(path_str);
        if p.exists() {
            return Err("Directory already exists.".to_string());
        }
        fs::create_dir_all(p).map_err(|e| format!("Failed creating directory: {}", e))
    }

    pub fn rename_path(old_path_str: &str, new_path_str: &str) -> Result<(), String> {
        let old_p = Path::new(old_path_str);
        let new_p = Path::new(new_path_str);
        if !old_p.exists() {
            return Err("Original file or directory does not exist.".to_string());
        }
        if new_p.exists() {
            return Err("Target path already exists.".to_string());
        }
        fs::rename(old_p, new_p).map_err(|e| format!("Failed renaming: {}", e))
    }

    pub fn delete_path(path_str: &str) -> Result<(), String> {
        let p = Path::new(path_str);
        if !p.exists() {
            return Err("Path does not exist.".to_string());
        }
        if p.is_dir() {
            fs::remove_dir_all(p).map_err(|e| format!("Failed removing directory: {}", e))
        } else {
            fs::remove_file(p).map_err(|e| format!("Failed removing file: {}", e))
        }
    }

    pub fn reveal_in_explorer(path_str: &str) -> Result<(), String> {
        let p = Path::new(path_str);
        if !p.exists() {
            return Err(format!("Path does not exist: {}", path_str));
        }

        let arg = format!("/select,\"{}\"", p.to_string_lossy());
        Command::new("explorer.exe")
            .arg(arg)
            .spawn()
            .map_err(|e| format!("Failed opening Windows Explorer: {}", e))?;
        Ok(())
    }
}
