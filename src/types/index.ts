export interface ToolStatus {
  detected: boolean;
  name: string;
  path?: string;
  version?: string;
  details?: string;
}

export interface GpuReport {
  name: string;
  vram_mb: number;
  driver_version?: string;
  is_discrete: boolean;
  acceleration: string;
}

export interface DiskReport {
  mount_point: string;
  total_space_gb: number;
  free_space_gb: number;
}

export interface SystemInfoReport {
  os_name: string;
  os_version: string;
  cpu_brand: string;
  cpu_cores: number;
  total_memory_mb: number;
  free_memory_mb: number;
  disks: DiskReport[];
  gpus: GpuReport[];
  primary_gpu?: GpuReport;
}

export interface InstallProgressEvent {
  component: string;
  stage: string;
  percent: number;
  message: string;
  error?: string;
}

export interface AndroidEnvironmentReport {
  system_info: SystemInfoReport;
  java: ToolStatus;
  android_sdk: ToolStatus;
  adb: ToolStatus;
  build_tools: ToolStatus;
  gradle: ToolStatus;
  git: ToolStatus;
  emulator: ToolStatus;
}

export interface AndroidDevice {
  serial: string;
  state: string;
  model: string;
  product: string;
  android_version?: string;
  api_level?: string;
  connection_type: string;
  is_authorized: boolean;
  transport_id?: string;
}

export interface AdbCommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code?: number;
}

export interface GradleBuildLineEvent {
  task: string;
  line: string;
  is_error: boolean;
}

export interface GradleBuildResult {
  success: boolean;
  exit_code?: number;
  task: string;
  apk_path?: string;
  apk_size_mb?: number;
  duration_seconds: number;
  error_message?: string;
}

export interface LogcatEntry {
  raw: string;
  timestamp: string;
  pid: string;
  tid: string;
  level: "VERBOSE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL" | string;
  tag: string;
  message: string;
}

export interface FileNode {
  id: string;
  name: string;
  path: string;
  is_dir: boolean;
  size?: number;
  extension?: string;
  children?: FileNode[];
}

export interface CreateProjectRequest {
  name: string;
  package_name: string;
  location: string;
  min_sdk: number;
  target_sdk: number;
  language: string;
  template: string;
  custom_sdk_path?: string;
}

export interface CreateProjectResponse {
  success: boolean;
  project_path: string;
  message: string;
}

export interface DexFileInfo {
  name: string;
  size_bytes: number;
}

export interface NativeLibAbiInfo {
  abi: string;
  files: string[];
  total_size_bytes: number;
}

export interface ApkAnalysisReport {
  file_name: string;
  file_path: string;
  file_size_mb: number;
  uncompressed_size_mb: number;
  compression_ratio_pct: number;
  package_name?: string;
  version_name?: string;
  version_code?: string;
  min_sdk?: string;
  target_sdk?: string;
  application_label?: string;
  permissions: string[];
  activities: string[];
  services: string[];
  receivers: string[];
  dex_files: DexFileInfo[];
  native_abis: NativeLibAbiInfo[];
  res_count: number;
  res_size_mb: number;
  assets_count: number;
  assets_size_mb: number;
  signature_schemes: string[];
}

export interface StorageCategory {
  name: string;
  path: string;
  exists: boolean;
  size_mb: number;
  size_gb: number;
  description: string;
  safe_to_clean: boolean;
  clean_impact: string;
}

export interface StorageAnalysisReport {
  total_dev_storage_gb: number;
  categories: StorageCategory[];
}

export interface SdkComponent {
  name: string;
  category: string;
  path: string;
  version: string;
  size_mb: number;
  is_installed: boolean;
}

export interface SdkPackagesReport {
  sdk_root: string;
  total_size_mb: number;
  installed_platforms: SdkComponent[];
  installed_build_tools: SdkComponent[];
  platform_tools?: SdkComponent;
  cmdline_tools: SdkComponent[];
  emulator?: SdkComponent;
  system_images: SdkComponent[];
  ndk: SdkComponent[];
}

export interface ProcessResourceUsage {
  name: string;
  pid: number;
  memory_mb: number;
  cpu_pct: number;
}

export interface SystemResourceReport {
  cpu_usage_pct: number;
  total_memory_mb: number;
  used_memory_mb: number;
  memory_usage_pct: number;
  primary_disk_name: string;
  primary_disk_total_gb: number;
  primary_disk_used_gb: number;
  primary_disk_pct: number;
  astra_ide_process: ProcessResourceUsage;
  gradle_daemon_memory_mb?: number;
}

export interface TerminalLineEvent {
  session_id: string;
  line: string;
  is_error: boolean;
}

export interface TerminalCommandResult {
  exit_code?: number;
  stdout: string;
  stderr: string;
}

export interface GitFileStatus {
  path: string;
  status: string;
  is_staged: boolean;
}

export interface GitCommitSummary {
  hash: string;
  message: string;
}

export interface GitRepoStatus {
  is_repo: boolean;
  current_branch?: string;
  files: GitFileStatus[];
  recent_commits: GitCommitSummary[];
}

export interface GitDiffResult {
  file_path: string;
  diff: string;
}

export interface RecentProject {
  name: string;
  path: string;
  last_opened: string;
}

export interface AstraIdeConfig {
  recent_projects: RecentProject[];
  theme: string;
  custom_sdk_path?: string;
  custom_jdk_path?: string;
  preferred_device_serial?: string;
  editor_font_size: number;
  editor_tab_size: number;
  editor_word_wrap: boolean;
  editor_font_family?: string;
  gradle_default_task?: string;
  logcat_buffer_size?: number;
  terminal_shell: string;
  telemetry_enabled: boolean;
  auto_save: boolean;
}

export interface OpenEditorTab {
  id: string;
  path: string;
  name: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
  extension: string;
}
