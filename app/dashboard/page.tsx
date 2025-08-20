"use client"
import ChatApp from "@/components/chat-app";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import IngestDialogContent from "@/components/ingest-dialog-content";
import React, { useEffect } from "react";

const USER_ID_STORAGE_KEY = "il_user_id";
const INGEST_DATA_STORAGE_KEY = "il_ingest_data";

function generateUserId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

type FileInfo = {
  name: string;
  type: 'document' | 'text' | 'crawl';
  uploadDate: string;
  size: number;
  originalUrl?: string;
};

type UserFilesResponse = {
  success: boolean;
  userId: string;
  files: FileInfo[];
  totalFiles: number;
};

const DashboardPage = () => {
  const [text, setText] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [userId, setUserId] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState<{ files: string[]; url: string; text: string }>({ files: [], url: "", text: "" });
  type IngestApiResponse = {
    success: boolean;
    userId: string;
    files: string[];
    text: string | null;
    crawl: { url: string; file: string } | null;
    indexing?: any;
  };
  const [ingestResult, setIngestResult] = React.useState<IngestApiResponse | null>(null);
  const [allUserFiles, setAllUserFiles] = React.useState<FileInfo[]>([]);

  async function fetchAllUserFiles(userId: string) {
    try {
      const response = await fetch(`/api/user-files?userId=${encodeURIComponent(userId)}`);
      const data: UserFilesResponse = await response.json();
      if (data.success) {
        setAllUserFiles(data.files);
      }
    } catch (error) {
      console.error("Error fetching user files:", error);
    }
  }

  useEffect(() => {
    try {
      // Load userId
      const existing = localStorage.getItem(USER_ID_STORAGE_KEY);
      if (existing) {
        setUserId(existing);
        fetchAllUserFiles(existing);
      } else {
        const created = generateUserId();
        localStorage.setItem(USER_ID_STORAGE_KEY, created);
        setUserId(created);
        fetchAllUserFiles(created);
      }

      // Load ingest data
      const savedIngestData = localStorage.getItem(INGEST_DATA_STORAGE_KEY);
      if (savedIngestData) {
        const parsedData = JSON.parse(savedIngestData);
        setText(parsedData.text || "");
        setUrl(parsedData.url || "");
        setSubmitted(parsedData.submitted || { files: [], url: "", text: "" });
        setIngestResult(parsedData.ingestResult || null);
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      // Fallback if localStorage is unavailable
      setUserId(generateUserId());
    }
  }, []);

  // Save ingest data to localStorage whenever relevant state changes
  useEffect(() => {
    try {
      const ingestData = {
        text,
        url,
        submitted,
        ingestResult
      };
      localStorage.setItem(INGEST_DATA_STORAGE_KEY, JSON.stringify(ingestData));
    } catch (error) {
      console.error("Error saving ingest data to localStorage:", error);
    }
  }, [text, url, submitted, ingestResult]);

  async function handleIngest() {
    try {
    setLoading(true);
    setSubmitted({ files: files.map((f) => f.name), url, text });
    const fd = new FormData();
    if (text.trim()) fd.append("text", text.trim());
    if (url.trim()) fd.append("url", url.trim());
    files.forEach((f) => fd.append("files", f));
    if (userId) fd.append("userId", userId);

    const res = await fetch("/api/ingest", { method: "POST", body: fd });
    const data = (await res.json()) as IngestApiResponse;
    setIngestResult(data);
    setLoading(false);
    
    // Refresh the file list to show newly ingested files
    if (data.success && userId) {
      await fetchAllUserFiles(userId);
    }
    } catch (error) {
      console.error("Error ingesting data:", error);
      setLoading(false);
    }
  }

  return (
    <div className="text-white font-dm-serif flex flex-col lg:flex-row h-screen p-2 sm:p-3 gap-2 sm:gap-3">
      <div className="w-full lg:w-1/3 h-1/3 lg:h-full">
        <div className="border border-white rounded-lg p-2 sm:p-3 h-full flex flex-col justify-between">
          <div className="flex items-center justify-center mb-1 sm:mb-3 flex-col gap-1 sm:gap-3">
            <div className="text-lg sm:text-2xl font-bold font-berkshire flex items-center gap-2">
              IngestLoom
            </div>
            <div className="w-full ">
              {allUserFiles.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-300 tracking-wide">
                    All Sources ({allUserFiles.length})
                  </div>
                  <div className="max-h-32  lg:max-h-96 overflow-y-auto sleek-scrollbar space-y-2 pr-2">
                    {allUserFiles.map((fileInfo, index) => {
                      const getDisplayName = (file: FileInfo) => {
                        if (file.type === 'text') {
                          return 'Text Data';
                        } else if (file.type === 'crawl') {
                          return file.name; // This now contains the domain name from the API
                        } else {
                          return file.name;
                        }
                      };
                      
                      const getTypeLabel = (file: FileInfo) => {
                        switch (file.type) {
                          case 'text': return 'Text Data';
                          case 'crawl': return 'Website';
                          case 'document': return 'Document';
                          default: return 'File';
                        }
                      };
                      
                      const formatDate = (dateStr: string) => {
                        const date = new Date(dateStr);
                        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      };
                      
                      return (
                        <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2">
                          <div className="text-sm font-medium text-white truncate">{getDisplayName(fileInfo)}</div>
                          <div className="flex justify-between items-center mt-1">
                            <div className="text-xs text-gray-400">{getTypeLabel(fileInfo)}</div>
                            <div className="text-xs text-gray-500">{formatDate(fileInfo.uploadDate)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-300 tracking-wide">Sources</div>
                  <div className="text-xs text-gray-500 text-center py-4">
                    No sources uploaded yet
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end flex-col gap-2 sm:gap-3 flex-1">
            <Textarea
              placeholder="Enter Data Here..."
              className="overflow-y-auto max-h-24 sm:max-h-64 lg:max-h-96 flex-1 resize-none sleek-scrollbar text-sm sm:text-base"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex items-center justify-between self-end w-full flex-col sm:flex-row gap-1 sm:gap-0">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-xs sm:text-sm font-dm-serif flex items-center gap-2 border border-white rounded-lg p-1 sm:p-2 w-full sm:w-auto justify-center sm:justify-start hover:cursor-pointer">
                    <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                    Upload File
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-black text-white">
                  <DialogHeader>
                    <DialogTitle className="font-dm-serif">Ingest</DialogTitle>
                  </DialogHeader>
                  <IngestDialogContent
                    url={url}
                    onUrlChange={setUrl}
                    files={files}
                    onFilesSelected={setFiles}
                  />
                </DialogContent>
              </Dialog>
              <button
                onClick={handleIngest}
                disabled={
                  loading ||
                  (
                    (!text || text.trim() === "") &&
                    (!url || url.trim() === "") &&
                    (!files || files.length === 0)
                  )
                }
                className="disabled:opacity-60 disabled:cursor-not-allowed text-xs sm:text-sm font-dm-serif flex items-center gap-2 border border-white rounded-lg p-1 sm:p-2 w-full sm:w-auto justify-center sm:justify-start bg-white text-black font-semibold hover:cursor-pointer"
              >
                {loading ? "Ingesting..." : "Ingest"}
                {loading ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <Send className="w-3 h-3 sm:w-4 sm:h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-2/3 h-2/3 lg:h-full">
          <ChatApp />
      </div>
    </div>
  );
};

export default DashboardPage;