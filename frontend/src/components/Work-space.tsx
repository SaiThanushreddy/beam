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
        <Loader2 size={64} className="text-rose-900" />
      </motion.div>
      <motion.div
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-xl font-medium text-gray-900"
      >
        {text}
      </motion.div>
      <p className="text-gray-700 text-center max-w-md">{subtext}</p>
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

    useEffect(() => {
      setEditorContent(fileContent);
    }, [fileContent]);

    const handleIframeLoad = () => {
      setIframeError(false);
      setIframeReady(true);
    };

    const handleIframeError = () => {
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

    if (!isConnected) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 bg-white">
          <Heart size={48} className="text-rose-900" />
          <h2 className="text-2xl font-semibold text-gray-900 font-heading">
            Connecting to Workspace...
          </h2>
          {error && (
            <div className="max-w-lg w-full text-left">
              <div className="text-red-600 border border-red-300 bg-red-50 rounded-lg p-4">
                <div className="font-semibold mb-2">Connection Error</div>
                <div className="text-sm">{error}</div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col bg-white"
      >
        {/* URL Bar */}
        <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200">
          <Button variant="ghost" size="icon" onClick={refreshIframe} disabled={!iframeUrl}>
            <RotateCcw size={16} />
          </Button>
          <div className="flex-1 bg-gray-100 text-gray-700 rounded-md px-3 py-2 text-sm border border-gray-200">
            {iframeUrl || "No URL loaded"}
          </div>
          <Button variant="ghost" size="icon" asChild>
            <a href={iframeUrl || undefined} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={16} />
            </a>
          </Button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden bg-gray-100">
          {viewMode === "preview" && (
            <div className="flex-1 relative">
              {iframeError ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <Heart size={48} className="text-rose-900" />
                    <div className="text-xl font-medium text-gray-900 font-heading">
                      Failed to load website
                    </div>
                    <p className="text-gray-600 text-center max-w-md">
                      The workspace took too long to load or failed to respond.
                    </p>
                  </div>
                </div>
              ) : !iframeUrl ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <LoadingState
                    text="Setting up your workspace..."
                    subtext="This may take a moment. We're getting everything ready for you."
                  />
                </div>
              ) : (
                <>
                  <motion.div
                    variants={fadeVariants}
                    initial="hidden"
                    animate={iframeReady && !isUpdateInProgress ? "visible" : "hidden"}
                    className="h-full w-full bg-white"
                  >
                    <iframe
                      ref={iframeRef}
                      src={iframeUrl}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                      allow="fullscreen"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full h-full border-0"
                      style={{ pointerEvents: isResizing ? "none" : "auto" }}
                      onLoad={handleIframeLoad}
                      onError={handleIframeError}
                    />
                  </motion.div>
                  {(!iframeReady || isUpdateInProgress || !initCompleted) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                      <LoadingState
                        text={
                          isUpdateInProgress
                            ? "Applying your changes..."
                            : "Loading your workspace..."
                        }
                        subtext={
                          isUpdateInProgress
                            ? "The preview will refresh once the updates are complete."
                            : "Almost there. Thanks for your patience."
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
              <div className="w-72 flex-shrink-0 bg-white border-r border-gray-200">
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
        <div className="flex items-center justify-between px-4 py-2 bg-white border-t border-gray-200">
          {/* View Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'preview' ? 'default' : 'ghost'}
              onClick={() => setViewMode("preview")}
              disabled={!initCompleted || isUpdateInProgress}
            >
              <Eye size={16} />
              Preview
            </Button>
            <Button
              variant={viewMode === 'code' ? 'default' : 'ghost'}
              onClick={() => setViewMode("code")}
              disabled={!iframeUrl || !iframeReady || isUpdateInProgress || !initCompleted}
            >
              <Code2 size={16} />
              Code
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  export default WorkspaceView;