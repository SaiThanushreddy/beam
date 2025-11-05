  import { useRef, useEffect, useState } from "react";
  import { motion } from "framer-motion";
  import {
    ExternalLink,
    Heart,
    Loader2,
    Play,
    RotateCcw,
    Eye,
    Code2,
    Columns,
  } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import FileExplorer from "./FileExplorer";
  import CodeEditor from "./CodeEditor";
  import type { FileNode } from "../types/messages";

  interface WorkspaceViewProps {
    isConnected: boolean;
    error: string | null;
    iframeUrl: string;
    iframeError: boolean;
    iframeReady: boolean;
    isUpdateInProgress: boolean;
    initCompleted: boolean;
    isResizing: boolean;
    refreshIframe: () => void;
    setIframeReady: (ready: boolean) => void;
    setIframeError: (error: boolean) => void;
    onRequestFileTree: () => void;
    onRequestFileContent: (path: string) => void;
    onSaveFile: (path: string, content: string) => void;
    fileTree: FileNode[];
    currentFile: string | null;
    fileContent: string;
    fileLanguage: string;
    isSaving: boolean;
    iframeRef: React.RefObject<HTMLIFrameElement>;
  }

  const LoadingState = ({ text, subtext }: { text: string; subtext: string }) => (
    <div className="flex flex-col items-center justify-center gap-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 size={64} className="text-gray-400" />
      </motion.div>
      <motion.div
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-xl font-medium text-gray-300"
      >
        {text}
      </motion.div>
      <p className="text-gray-500 text-center max-w-md">{subtext}</p>
    </div>
  );

  const WorkspaceView = ({
    isConnected,
    error,
    iframeUrl,
    iframeError,
    iframeReady,
    isUpdateInProgress,
    initCompleted,
    isResizing,
    refreshIframe,
    setIframeReady,
    setIframeError,
    onRequestFileTree,
    onRequestFileContent,
    onSaveFile,
    fileTree,
    currentFile,
    fileContent,
    iframeRef,
    fileLanguage,
    isSaving,
  }: WorkspaceViewProps) => {
    const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
    const [editorContent, setEditorContent] = useState(fileContent);
    // const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
      setEditorContent(fileContent);
    }, [fileContent]);

    const handleIframeLoad = () => {
      console.log("✅ Iframe loaded successfully:", iframeUrl);
      setIframeError(false);
      setIframeReady(true);
    };

    const handleIframeError = () => {
      console.error("❌ Iframe failed to load:", iframeUrl);
      setIframeError(true);
    };

    const handleSaveFile = () => {
      if (currentFile && editorContent) {
        onSaveFile(currentFile, editorContent);
      }
    };

    const handleCloseEditor = () => {
      setViewMode("preview");
    };

    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration: 0.6, delay: 0.3 },
      },
    };

    const fadeVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration: 0.8 },
      },
    };

    const slideUpVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay: i * 0.2 },
      }),
    };

    if (!isConnected) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Heart size={64} className="text-gray-600" />
          </motion.div>
          <h2 className="text-2xl font-semibold text-gray-400">
            Connect to start building
          </h2>
          {error && (
            <div className="max-w-lg">
              <div className="text-red-500 border border-red-500 rounded-lg p-4 mb-4">
                <div className="font-semibold mb-2">Connection Error</div>
                <div className="text-sm">{error}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm text-gray-400">
                <div className="font-semibold text-white mb-2">Troubleshooting:</div>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Check if WebSocket URL is correct in config</li>
                  <li>Verify authentication token is valid</li>
                  <li>Ensure backend server is running</li>
                  <li>Check browser console for detailed errors</li>
                </ul>
              </div>
            </div>
          )}
          <div className="space-y-4 mt-8">
            {[
              "Connect to Workspace",
              "Chat with AI in the sidebar",
              "Select specific elements to modify",
            ].map((text, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={slideUpVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-3 text-gray-500"
              >
                <Play size={16} />
                <span>{text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col bg-zinc-950"
      >
        {/* URL Bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={refreshIframe}
            disabled={!iframeUrl}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <RotateCcw size={16} />
          </motion.button>
          <input
            value={iframeUrl || ""}
            readOnly
            className="flex-1 bg-zinc-800 text-gray-300 rounded-lg px-3 py-2 text-sm border border-zinc-700"
          />
          <motion.a
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            href={iframeUrl || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ExternalLink size={16} />
          </motion.a>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {viewMode === "preview" && (
            <div className="flex-1 relative bg-zinc-900">
              {iframeError ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-6">
                    <Heart size={64} className="text-gray-600" />
                    <div className="text-xl font-medium text-gray-300">
                      Failed to load website
                    </div>
                    <p className="text-gray-500 text-center max-w-md">
                      {iframeUrl} took too long to load or failed to respond.
                    </p>
                  </div>
                </div>
              ) : !iframeUrl ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <LoadingState
                    text="Connecting to Workspace..."
                    subtext="Please wait while we setup your workspace and load the website."
                  />
                </div>
              ) : (
                <>
                  <motion.div
                    variants={fadeVariants}
                    initial="hidden"
                    animate={iframeReady && !isUpdateInProgress ? "visible" : "hidden"}
                    className="h-full w-full"
                  >
                    <iframe
                      ref={iframeRef}
                      src={iframeUrl}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                      allow="fullscreen"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full h-full"
                      style={{ pointerEvents: isResizing ? "none" : "auto" }}
                      onLoad={handleIframeLoad}
                      onError={handleIframeError}
                    />
                  </motion.div>
                  {(!iframeReady || isUpdateInProgress || !initCompleted) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <LoadingState
                        text={
                          isUpdateInProgress
                            ? "Updating Workspace..."
                            : "Connecting to Workspace..."
                        }
                        subtext={
                          isUpdateInProgress
                            ? "Please wait while we apply your changes to the website."
                            : "Please wait while we setup your workspace and load the website."
                        }
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {viewMode === "code" && (
            <>
              <div className="w-64 flex-shrink-0">
                <FileExplorer
                  fileTree={fileTree}
                  onSelectFile={onRequestFileContent}
                  selectedPath={currentFile}
                  onRequestFileTree={onRequestFileTree}
                />
              </div>
              <CodeEditor
                currentFile={currentFile}
                fileContent={fileContent}
                fileLanguage={fileLanguage}
                onContentChange={setEditorContent}
                onSave={handleSaveFile}
                onClose={handleCloseEditor}
                isSaving={isSaving}
              />
            </>
          )}

        
        </div>

        {/* Bottom Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-t border-zinc-800">
          {/* View Toggle */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${viewMode === "preview"
                ? "bg-zinc-800 text-white"
                : "text-gray-400 hover:bg-zinc-800"
                }`}
              disabled={
                !initCompleted || isUpdateInProgress
              }
            >
              <Eye size={16} />
              Preview
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode("code")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${viewMode === "code"
                ? "bg-zinc-800 text-white"
                : "text-gray-400 hover:bg-zinc-800"
                }`}
              disabled={
                !iframeUrl || !iframeReady || isUpdateInProgress || !initCompleted
              }
            >
              <Code2 size={16} />
              Code
            </motion.button>
            
          </div>


        </div>
      </motion.div>
    );
  };

  export default WorkspaceView;