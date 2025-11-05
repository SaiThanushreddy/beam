import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageType, Sender, type FileNode } from "../../types/messages";
import { BEAM_CONFIG } from "../../config/beam";
import { useMessageBus } from "../../hooks/useMessageBus";
import ChatSidebar from "../../components/chat-sidebar";
import WorkspaceView from "../../components/Work-space";

const Create = () => {
  const [inputValue, setInputValue] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [iframeUrl, setIframeUrl] = useState("");
  const [iframeError, setIframeError] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);
  const [isUpdateInProgress, setIsUpdateInProgress] = useState(false);
  const [initCompleted, setInitCompleted] = useState(false);
  const [sandboxExists, setSandboxExists] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  // Code preview states
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [fileLanguage, setFileLanguage] = useState<string>("javascript");
  const [isSaving, setIsSaving] = useState(false);

  const hasConnectedRef = useRef(false);
  const processedMessageIds = useRef(new Set());
  const initialPromptSent = useRef(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const location = useLocation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id") || location.state?.session_id;

  useEffect(() => {
    setTimeout(() => setPageLoaded(true), 100);
  }, []);

  const refreshIframe = useCallback(() => {
    if (iframeRef.current && iframeUrl && iframeUrl !== "/") {
      setIframeReady(false);
      setIframeError(false);

      // Force iframe reload
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = "";

      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 100);
    }
  }, [iframeUrl]);

  const messageHandlers = {
    [MessageType.INIT]: (message: any) => {
      console.log("📥 INIT message received:", message);
      const id = message.id;
      if (id) {
        if (processedMessageIds.current.has(id)) {
          console.log("⚠️ INIT message already processed, skipping");
          return;
        }
        processedMessageIds.current.add(id);
      }

      console.log("✅ Setting initCompleted to true");
      setInitCompleted(true);

      if (typeof message.data.url === "string" && message.data.sandbox_id) {
        console.log("📍 Setting iframe URL:", message.data.url);
        setIframeUrl(message.data.url);
        setIframeError(false);
      } else {
        console.log("⚠️ No URL in INIT message, waiting for sandbox creation");
      }

      if (message.data.exists === true) {
        console.log("📦 Sandbox already exists");
        setSandboxExists(true);
      } else {
        console.log("🆕 New sandbox will be created");
      }

      setMessages((prev) => {
        if (id) {
          const existingIndex = prev.findIndex((msg) => msg.id === id);
          if (existingIndex !== -1) {
            return prev.map((msg, idx) =>
              idx === existingIndex
                ? {
                  ...msg,
                  timestamp: message.timestamp || msg.timestamp,
                  data: {
                    ...msg.data,
                    text: "Workspace loaded! You can now make edits here.",
                    sender: Sender.ASSISTANT,
                  },
                }
                : msg
            );
          }
        }
        return [
          ...prev,
          {
            ...message,
            timestamp: message.timestamp || Date.now(),
            data: {
              ...message.data,
              text: "Workspace loaded! You can now make edits here.",
              sender: Sender.ASSISTANT,
            },
          },
        ];
      });
    },

    [MessageType.ERROR]: (message) => {
      console.error("❌ ERROR message received:", message);
      setIsSaving(false);
      setMessages((prev) => [
        ...prev,
        {
          ...message,
          timestamp: message.timestamp || Date.now(),
          data: { ...message.data, sender: Sender.ASSISTANT },
        },
      ]);
    },

    [MessageType.AGENT_PARTIAL]: (message) => {
      const { text } = message.data;
      const { id } = message;

      if (!id || !text?.trim()) return;

      setMessages((prev) => {
        const existingIndex = prev.findIndex((msg) => msg.id === id);
        if (existingIndex !== -1) {
          return prev.map((msg, idx) =>
            idx === existingIndex
              ? {
                ...msg,
                timestamp: message.timestamp || msg.timestamp,
                data: {
                  ...msg.data,
                  text: text.replace(/\\/g, ""),
                  sender: Sender.ASSISTANT,
                  isStreaming: true,
                },
              }
              : msg
          );
        }
        return [
          ...prev,
          {
            ...message,
            timestamp: message.timestamp || Date.now(),
            data: {
              ...message.data,
              text: text.replace(/\\/g, ""),
              isStreaming: true,
              sender: Sender.ASSISTANT,
            },
          },
        ];
      });
    },

    [MessageType.AGENT_FINAL]: (message:any) => {
      const { text } = message.data;
      const { id } = message;

      if (!id || !text?.trim()) return;

      setMessages((prev) => {
        const existingIndex = prev.findIndex((msg) => msg.id === id);
        if (existingIndex !== -1) {
          return prev.map((msg, idx) =>
            idx === existingIndex
              ? {
                ...msg,
                timestamp: message.timestamp || msg.timestamp,
                data: {
                  ...msg.data,
                  text: text.replace(/\\/g, ""),
                  isStreaming: false,
                  sender: Sender.ASSISTANT,
                },
              }
              : msg
          );
        }
        return [
          ...prev,
          {
            ...message,
            timestamp: message.timestamp || Date.now(),
            data: {
              ...message.data,
              text: text.replace(/\\/g, ""),
              isStreaming: false,
              sender: Sender.ASSISTANT,
            },
          },
        ];
      });
    },

    [MessageType.UPDATE_IN_PROGRESS]: (message) => {
      setIsUpdateInProgress(true);
      const { id } = message;

      setMessages((prev) => {
        if (id) {
          const existingIndex = prev.findIndex((msg) => msg.id === id);
          if (existingIndex !== -1) {
            return prev.map((msg, idx) =>
              idx === existingIndex
                ? {
                  ...msg,
                  timestamp: message.timestamp || msg.timestamp,
                  data: {
                    ...msg.data,
                    text: "Ok - I'll make those changes!",
                    sender: Sender.ASSISTANT,
                  },
                }
                : msg
            );
          }
        }
        return [
          ...prev,
          {
            ...message,
            timestamp: message.timestamp || Date.now(),
            data: {
              ...message.data,
              text: "Ok - I'll make those changes!",
              sender: Sender.ASSISTANT,
            },
          },
        ];
      });
    },

    [MessageType.UPDATE_FILE]: (message) => {
      const { id } = message;
      if (!id) return;

      setMessages((prev) => {
        const existingIndex = prev.findIndex((msg) => msg.id === id);
        if (existingIndex !== -1) {
          return prev.map((msg, idx) =>
            idx === existingIndex
              ? {
                ...msg,
                timestamp: message.timestamp || msg.timestamp,
                data: {
                  ...msg.data,
                  text: message.data.text,
                  sender: Sender.ASSISTANT,
                  isStreaming: true,
                },
              }
              : msg
          );
        }
        return [
          ...prev,
          {
            ...message,
            timestamp: message.timestamp || Date.now(),
            data: {
              ...message.data,
              text: message.data.text,
              sender: Sender.ASSISTANT,
              isStreaming: true,
            },
          },
        ];
      });
    },

    [MessageType.UPDATE_COMPLETED]: (message) => {
      setIsUpdateInProgress(false);
      const { id } = message;

      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.type !== MessageType.UPDATE_FILE);

        if (id) {
          const existingIndex = filtered.findIndex((msg) => msg.id === id);
          if (existingIndex !== -1) {
            return filtered.map((msg, idx) =>
              idx === existingIndex
                ? {
                  ...msg,
                  timestamp: message.timestamp || msg.timestamp || Date.now(),
                  data: {
                    ...msg.data,
                    text: "Update completed!",
                    sender: Sender.ASSISTANT,
                  },
                }
                : msg
            );
          }
        }
        return [
          ...filtered,
          {
            ...message,
            timestamp: message.timestamp || Date.now(),
            data: {
              ...message.data,
              text: "Update completed!",
              sender: Sender.ASSISTANT,
            },
          },
        ];
      });
      refreshIframe();
    },

    [MessageType.FILE_TREE]: (message) => {
      setFileTree(message.data.tree || []);
    },

    [MessageType.FILE_CONTENT]: (message) => {
      setCurrentFile(message.data.path);
      setFileContent(message.data.content || "");
      setFileLanguage(message.data.language || "javascript");
    },

    [MessageType.FILE_SAVED]: (message) => {
      setIsSaving(false);
      refreshIframe();

      // Add success message
      setMessages((prev) => [
        ...prev,
        {
          type: MessageType.FILE_SAVED,
          timestamp: Date.now(),
          data: {
            text: `File saved: ${message.data.path}`,
            sender: Sender.ASSISTANT,
          },
        },
      ]);
    },
  };

  const { isConnected, error, connect, send } = useMessageBus({
    wsUrl: BEAM_CONFIG.WS_URL,
    token: BEAM_CONFIG.TOKEN,
    sessionId: sessionId,
    handlers: messageHandlers,
    onConnect: () => {
      console.log("✅ Connected to Beam Cloud");
      setMessages((prev) => [
        ...prev,
        {
          type: MessageType.INIT,
          timestamp: Date.now(),
          data: {
            text: "Connected to workspace!",
            sender: Sender.ASSISTANT,
          },
        },
      ]);
    },
    onDisconnect: () => {
      hasConnectedRef.current = false;
    },
    onError: (errorMsg) => {
      setMessages((prev) => [
        ...prev,
        {
          type: MessageType.ERROR,
          timestamp: Date.now(),
          data: {
            text: `Connection error: ${errorMsg}. Please check your configuration.`,
            sender: Sender.ASSISTANT,
          },
        },
      ]);
    },
  });

  // Handler functions for code preview
  const handleRequestFileTree = useCallback(() => {
    if (!sessionId) return;
    console.log("📁 Requesting file tree");
    send(MessageType.GET_FILE_TREE, { session_id: sessionId });
  }, [send, sessionId]);

  const handleRequestFileContent = useCallback((path: string) => {
    if (!sessionId) return;
    console.log("📄 Requesting file content:", path);
    send(MessageType.GET_FILE_CONTENT, { session_id: sessionId, path });
  }, [send, sessionId]);

  const handleSaveFile = useCallback((path: string, content: string) => {
    if (!sessionId) return;
    console.log("💾 Saving file:", path);
    setIsSaving(true);
    send(MessageType.SAVE_FILE, { session_id: sessionId, path, content });
  }, [send, sessionId]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = e.clientX;
        setSidebarWidth(Math.max(300, Math.min(800, newWidth)));
      }
    };

    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleSendMessage = () => {
    if (inputValue.trim() && sessionId) {
      send(MessageType.USER, { text: inputValue, session_id: sessionId });
      setMessages((prev) => [
        ...prev,
        {
          type: MessageType.USER,
          timestamp: Date.now(),
          data: { text: inputValue, sender: Sender.USER },
          session_id: sessionId,
        },
      ]);
      setInputValue("");
    }
  };

  useEffect(() => {
    if (sessionId && !hasConnectedRef.current) {
      hasConnectedRef.current = true;
      console.log("🔌 Initiating connection with sessionId:", sessionId);
      connect();
    } else if (!sessionId) {
      console.error("❌ No session ID available");
      setMessages((prev) => [
        ...prev,
        {
          type: MessageType.ERROR,
          timestamp: Date.now(),
          data: {
            text: "Missing session ID. Please restart the workspace.",
            sender: Sender.ASSISTANT,
          },
        },
      ]);
    }
  }, [sessionId, connect]);

  useEffect(() => {
    if (!isConnected) {
      console.log("🧹 Clearing processed message IDs");
      processedMessageIds.current.clear();
    }
  }, [isConnected]);

  useEffect(() => {
    if (iframeUrl) {
      console.log("🔄 Iframe URL changed, resetting iframe ready state");
      setIframeReady(false);
    }
  }, [iframeUrl]);

  useEffect(() => {
    if (
      initCompleted &&
      !sandboxExists &&
      location.state?.initialPrompt &&
      !initialPromptSent.current &&
      isConnected &&
      sessionId
    ) {
      console.log("📤 Sending initial prompt:", location.state.initialPrompt);
      send(MessageType.USER, { text: location.state.initialPrompt, session_id: sessionId });
      setMessages((prev) => [
        ...prev,
        {
          type: MessageType.USER,
          timestamp: Date.now(),
          data: { text: location.state.initialPrompt, sender: Sender.USER },
          session_id: sessionId,
        },
      ]);
      initialPromptSent.current = true;
    }
  }, [initCompleted, sandboxExists, location.state, send, sessionId, isConnected]);


  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: pageLoaded ? 1 : 0, scale: pageLoaded ? 1 : 0.98 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex h-screen w-full bg-black text-white overflow-hidden"
    >
      <ChatSidebar
        sidebarWidth={sidebarWidth}
        messages={messages}
        inputValue={inputValue}
        setInputValue={setInputValue}
        handleSendMessage={handleSendMessage}
        isConnected={isConnected}
        iframeReady={iframeReady}
      />

      <div
        onMouseDown={() => setIsResizing(true)}
        className="w-1 cursor-col-resize bg-zinc-900 hover:bg-zinc-700 transition-colors"
      />

      <WorkspaceView
        isConnected={isConnected}
        error={error}
        iframeUrl={iframeUrl}
        iframeError={iframeError}
        iframeReady={iframeReady}
        isUpdateInProgress={isUpdateInProgress}
        initCompleted={initCompleted}
        isResizing={isResizing}
        refreshIframe={refreshIframe}
        setIframeReady={setIframeReady}
        setIframeError={setIframeError}
        onRequestFileTree={handleRequestFileTree}
        onRequestFileContent={handleRequestFileContent}
        onSaveFile={handleSaveFile}
        fileTree={fileTree}
        currentFile={currentFile}
        fileContent={fileContent}
        fileLanguage={fileLanguage}
        isSaving={isSaving}
         iframeRef={iframeRef}
      />
    </motion.div>
  );
};

export default Create;