import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Loader2,
} from "lucide-react";
import type { FileNode }  from "../types/messages";

interface FileTreeItemProps {
  node: FileNode;
  level?: number;
  onSelectFile: (path: string) => void;
  selectedPath: string | null;
}

const FileTreeItem = ({
  node,
  level = 0,
  onSelectFile,
  selectedPath,
}: FileTreeItemProps) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);

  const handleClick = () => {
    if (node.is_dir) {
      setIsExpanded(!isExpanded);
    } else {
      onSelectFile(node.path);
    }
  };

  const isSelected = selectedPath === node.path;

  return (
    <div>
      <motion.div
        whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
        onClick={handleClick}
        className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded text-sm ${
          isSelected ? "bg-blue-600/20 text-blue-400" : "text-gray-300"
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {node.is_dir ? (
          <>
            {isExpanded ? (
              <ChevronDown size={14} className="text-gray-500" />
            ) : (
              <ChevronRight size={14} className="text-gray-500" />
            )}
            {isExpanded ? (
              <FolderOpen size={16} className="text-yellow-500" />
            ) : (
              <Folder size={16} className="text-yellow-500" />
            )}
          </>
        ) : (
          <>
            <div style={{ width: 14 }} />
            <File size={16} className="text-blue-400" />
          </>
        )}
        <span className="truncate">{node.name}</span>
        {!node.is_dir && node.size && (
          <span className="text-xs text-gray-600 ml-auto">
            {(node.size / 1024).toFixed(1)}KB
          </span>
        )}
      </motion.div>
      {node.is_dir && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              level={level + 1}
              onSelectFile={onSelectFile}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface FileExplorerProps {
  fileTree: FileNode[];
  onSelectFile: (path: string) => void;
  selectedPath: string | null;
  onRequestFileTree: () => void;
}

const FileExplorer = ({
  fileTree,
  onSelectFile,
  selectedPath,
  onRequestFileTree,
}: FileExplorerProps) => {
  useEffect(() => {
    if (fileTree.length === 0) {
      onRequestFileTree();
    }
  }, []);

  return (
    <div className="h-full bg-zinc-950 border-r border-zinc-800 overflow-y-auto">
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">FILES</h3>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onRequestFileTree}
          className="p-1 hover:bg-zinc-800 rounded"
        >
          <RotateCcw size={14} className="text-gray-500" />
        </motion.button>
      </div>
      <div className="py-2">
        {fileTree.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            <Loader2 size={24} className="mx-auto mb-2 animate-spin" />
            Loading files...
          </div>
        ) : (
          fileTree.map((node) => (
            <FileTreeItem
              key={node.path}
              node={node}
              onSelectFile={onSelectFile}
              selectedPath={selectedPath}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default FileExplorer;