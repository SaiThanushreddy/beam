// ========================
// Message Types
// ========================
export enum MessageType {
  INIT = "init",
  USER = "user",
  AGENT_PARTIAL = "agent_partial",
  AGENT_FINAL = "agent_final",
  LOAD_CODE = "load_code",
  EDIT_CODE = "edit_code",
  UPDATE_IN_PROGRESS = "update_in_progress",
  UPDATE_FILE = "update_file",
  UPDATE_COMPLETED = "update_completed",
  GET_FILE_TREE = "get_file_tree",
  FILE_TREE = "file_tree",
  GET_FILE_CONTENT = "get_file_content",
  FILE_CONTENT = "file_content",
  SAVE_FILE = "save_file",
  FILE_SAVED = "file_saved",
  ERROR = "error",
  PING = "ping",
}

// ========================
// Sender Types
// ========================
export enum Sender {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system",
}

// ========================
// File Node Interface
// ========================
export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  type: "file" | "folder";
  size?: number;
  language?: string;
  children?: FileNode[];
}

// ========================
// Message Data
// ========================
export interface MessageData {
  text?: string;
  sender: Sender;
  isStreaming?: boolean;
  url?: string;
  sandbox_id?: string;
  exists?: boolean;
  tree?: FileNode[];
  root?: string;
  path?: string;
  content?: string;
  language?: string;
  success?: boolean;
  error?: string;
}

// ========================
// Message Interface
// ========================
export interface Message {
  type: MessageType;
  data: Record<string, any>;
  id?: string;
  timestamp?: number;
  session_id?: string;
}

// ========================
// WebSocket Message Interface
// ========================
export interface WSMessage {
  id?: string;
  type: string;
  data: Record<string, any>;
  timestamp?: number;
  session_id?: string;
}

// ========================
// Message Handlers
// ========================
export type MessageHandler = (message: Message) => void;

export type MessageHandlers = {
  [key in MessageType]?: MessageHandler;
};

// ========================
// Connection State
// ========================
export interface ConnectionState {
  isConnected: boolean;
  error: string | null;
  reconnectAttempts: number;
}

// ========================
// Sandbox Data
// ========================
export interface SandboxData {
  url: string;
  sandbox_id: string;
  exists?: boolean;
}

// ========================
// Code File
// ========================
export interface CodeFile {
  path: string;
  content: string;
  language?: string;
}

// ========================
// Chat Message (UI)
// ========================
export interface ChatMessage {
  id?: string;
  type: MessageType;
  timestamp: number;
  data: {
    text: string;
    sender: Sender;
    isStreaming?: boolean;
  };
  session_id?: string;
}

// ========================
// Workspace State
// ========================
export interface WorkspaceState {
  iframeUrl: string;
  iframeReady: boolean;
  iframeError: boolean;
  isUpdateInProgress: boolean;
  initCompleted: boolean;
  sandboxExists: boolean;
}

// ========================
// Code Editor State
// ========================
export interface CodeEditorState {
  currentFile: string | null;
  fileContent: string;
  fileLanguage: string;
  fileTree: FileNode[];
  isSaving: boolean;
  isDirty: boolean;
}

// ========================
// View Mode
// ========================
export type ViewMode = "preview" | "code" | "split";

// ========================
// Error Types
// ========================
export enum ErrorType {
  CONNECTION_ERROR = "connection_error",
  SANDBOX_ERROR = "sandbox_error",
  FILE_ERROR = "file_error",
  UNKNOWN_ERROR = "unknown_error",
}

// ========================
// Error Interface
// ========================
export interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
  timestamp: number;
}

// ========================
// Session Configuration
// ========================
export interface SessionConfig {
  sessionId: string;
  wsUrl: string;
  token: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

// ========================
// File Responses
// ========================
export interface FileTreeResponse {
  tree: FileNode[];
  root: string;
}

export interface FileContentResponse {
  path: string;
  content: string;
  language: string;
}

export interface FileSaveResponse {
  path: string;
  success: boolean;
}

// ========================
// Agent Response
// ========================
export interface AgentResponse {
  plan: string;
  files: CodeFile[];
  package_json?: string;
}

// ========================
// Streaming State
// ========================
export interface StreamingState {
  isStreaming: boolean;
  messageId: string | null;
  currentText: string;
}

// ========================
// Utility: Create Message
// ========================
export const createMessage = (
  type: MessageType,
  data: Record<string, any> = {},
  id?: string,
  timestamp?: number,
  session_id?: string
): Message => ({
  type,
  data,
  id,
  timestamp: timestamp || Date.now(),
  session_id,
});
