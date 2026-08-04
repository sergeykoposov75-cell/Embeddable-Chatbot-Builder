"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB — free Supabase storage limit

interface UploadZoneProps {
  userId: string;
}

export function UploadZone({ userId }: UploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);
    setStatus("uploading");
    setErrorMsg(null);

    try {
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        throw new Error(`File is ${sizeMB} MB. Maximum allowed size is 50 MB.`);
      }

      const initRes = await fetch("/api/upload/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name }),
      });
      if (!initRes.ok) {
        const data = await initRes.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      const { documentId, signedUrl } = await initRes.json();

      const putRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!putRes.ok) {
        let detail = "";
        try {
          const body = await putRes.json();
          detail = body?.message || body?.error || "";
        } catch {
          /* ignore */
        }
        throw new Error(detail || `Storage upload failed (HTTP ${putRes.status}). Check the 50 MB upload limit.`);
      }

      const processRes = await fetch("/api/upload/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      if (!processRes.ok) {
        const data = await processRes.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      setStatus("success");
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [userId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-black bg-gray-50" : "border-gray-300 hover:border-gray-400"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input {...getInputProps()} />
        {status === "uploading" ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-10 w-10 text-gray-400 animate-pulse" />
            <p className="text-sm text-gray-600">Uploading and processing {fileName}...</p>
          </div>
        ) : status === "success" ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="h-10 w-10 text-green-500" />
            <p className="text-sm text-green-600 font-medium">{fileName} uploaded successfully!</p>
            <p className="text-xs text-gray-500">Drop another file to upload more</p>
          </div>
        ) : status === "error" ? (
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <p className="text-sm text-red-600 font-medium">Upload failed. Try again.</p>
            {errorMsg && <p className="text-xs text-red-500 max-w-sm">{errorMsg}</p>}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-gray-400" />
            {isDragActive ? (
              <p className="text-sm text-gray-600">Drop the file here...</p>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Drag & drop a file here, or click to select
                </p>
                <p className="text-xs text-gray-400">PDF, DOCX, or TXT</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

    
      
        
      
        
            


    
   
        
          
           
