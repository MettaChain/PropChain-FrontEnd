"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FileUploadFile {
  file: File;
  id: string;
  preview?: string;
  progress?: number;
  error?: string;
  status: "pending" | "uploading" | "success" | "error";
}

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  onFilesChange?: (files: FileUploadFile[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  showProgress?: boolean;
}

export function FileUpload({
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024,
  maxFiles = 10,
  onFilesChange,
  onUpload,
  className,
  disabled = false,
  showPreview = true,
  showProgress = true,
}: FileUploadProps) {
  const [files, setFiles] = React.useState<FileUploadFile[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size exceeds ${formatFileSize(maxSize)}`;
    }
    if (accept) {
      const acceptedTypes = accept.split(",").map((t) => t.trim());
      const fileExt = `.${file.name.split(".").pop()}`;
      const matchesType = acceptedTypes.some(
        (t) =>
          file.type === t ||
          fileExt === t ||
          (t.includes("*") && file.type.startsWith(t.replace("*", "")))
      );
      if (!matchesType) {
        return `File type not accepted. Accepted: ${accept}`;
      }
    }
    return null;
  };

  const processFiles = (fileList: FileList | File[]) => {
    const newFiles = Array.from(fileList);
    const validFiles: FileUploadFile[] = [];

    for (const file of newFiles) {
      if (files.length + validFiles.length >= maxFiles) break;

      const error = validateFile(file);
      const fileUpload: FileUploadFile = {
        file,
        id: generateId(),
        status: error ? "error" : "pending",
        error: error || undefined,
      };

      if (showPreview && !error && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileUpload.id
                ? { ...f, preview: e.target?.result as string }
                : f
            )
          );
        };
        reader.readAsDataURL(file);
      }

      validFiles.push(fileUpload);
    }

    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    processFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    const updatedFiles = files.filter((f) => f.id !== id);
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
  };

  const handleUpload = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending").map((f) => f.file);
    if (!pendingFiles.length || !onUpload) return;

    setFiles((prev) =>
      prev.map((f) => (f.status === "pending" ? { ...f, status: "uploading", progress: 0 } : f))
    );

    try {
      await onUpload(pendingFiles);
      setFiles((prev) =>
        prev.map((f) => (f.status === "uploading" ? { ...f, status: "success", progress: 100 } : f))
      );
    } catch {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading" ? { ...f, status: "error", error: "Upload failed" } : f
        )
      );
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        <div className="flex flex-col items-center gap-2">
          <svg
            className={cn("w-10 h-10", isDragging ? "text-blue-500" : "text-gray-400")}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {isDragging ? (
              <span className="font-medium text-blue-600">Drop files here</span>
            ) : (
              <>
                <span className="font-medium text-blue-600">Click to upload</span>{" "}
                or drag and drop
              </>
            )}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {accept && `${accept} `}
            {maxSize && `Max ${formatFileSize(maxSize)}`}
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((fileUpload) => (
            <FileUploadItem
              key={fileUpload.id}
              fileUpload={fileUpload}
              showPreview={showPreview}
              showProgress={showProgress}
              onRemove={() => removeFile(fileUpload.id)}
            />
          ))}
        </div>
      )}

      {files.some((f) => f.status === "pending") && onUpload && (
        <button
          onClick={handleUpload}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Upload {files.filter((f) => f.status === "pending").length} file(s)
        </button>
      )}
    </div>
  );
}

interface FileUploadItemProps {
  fileUpload: FileUploadFile;
  showPreview: boolean;
  showProgress: boolean;
  onRemove: () => void;
}

function FileUploadItem({
  fileUpload,
  showPreview,
  showProgress,
  onRemove,
}: FileUploadItemProps) {
  const { file, preview, progress, error, status } = fileUpload;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border",
        status === "error" && "border-red-300 bg-red-50 dark:bg-red-950",
        status === "success" && "border-green-300 bg-green-50 dark:bg-green-950",
        status === "pending" && "border-gray-200 dark:border-gray-700",
        status === "uploading" && "border-blue-300 bg-blue-50 dark:bg-blue-950"
      )}
    >
      {showPreview && preview && (
        <img src={preview} alt={file.name} className="w-10 h-10 rounded object-cover" />
      )}
      {!showPreview && (
        <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
        {showProgress && status === "uploading" && progress !== undefined && (
          <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>}
      </div>
      <div className="flex items-center gap-2">
        {status === "success" && (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
