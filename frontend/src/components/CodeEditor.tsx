import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { File, Save, X, Loader2 } from "lucide-react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  currentFile: string | null;
  fileContent: string;
  fileLanguage: string;
  onContentChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
  isSaving: boolean;
}

const CodeEditor = ({
  currentFile,
  fileContent,
  fileLanguage,
  onContentChange,
  onSave,
  onClose,
  isSaving,
}: CodeEditorProps) => {
  const [isDirty, setIsDirty] = useState(false);
  const [localContent, setLocalContent] = useState(fileContent);

  useEffect(() => {
    setLocalContent(fileContent);
    setIsDirty(false);
  }, [fileContent, currentFile]);

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setLocalContent(value);
      setIsDirty(value !== fileContent);
      onContentChange(value);
    }
  };

  const handleSave = () => {
    onSave();
    setIsDirty(false);
  };

  if (!currentFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-900">
        <div className="text-center">
          <File size={64} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">Select a file to view its contents</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-900">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <File size={16} className="text-blue-400" />
          <span className="text-sm text-gray-300 font-mono">
            {currentFile.split("/").pop()}
          </span>
          {isDirty && (
            <span className="text-xs text-orange-500">● Modified</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white rounded text-sm transition-colors"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Save
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
          >
            <X size={16} className="text-gray-400" />
          </motion.button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={fileLanguage}
          value={localContent}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;