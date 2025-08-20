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
import React from "react";

const USER_ID_STORAGE_KEY = "il_user_id";

function generateUserId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const DashboardPage = () => {
  const [text, setText] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [userId, setUserId] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    try {
      const existing = localStorage.getItem(USER_ID_STORAGE_KEY);
      if (existing) {
        setUserId(existing);
      } else {
        const created = generateUserId();
        localStorage.setItem(USER_ID_STORAGE_KEY, created);
        setUserId(created);
      }
    } catch (_) {
      // Fallback if localStorage is unavailable
      setUserId(generateUserId());
    }
  }, []);

  async function handleIngest() {
    try {
    setLoading(true);
    const fd = new FormData();
    if (text.trim()) fd.append("text", text.trim());
    if (url.trim()) fd.append("url", url.trim());
    files.forEach((f) => fd.append("files", f));
    if (userId) fd.append("userId", userId);

    await fetch("/api/ingest", { method: "POST", body: fd });
    setLoading(false);
    } catch (error) {
      console.error("Error ingesting data:", error);
      setLoading(false);
    }
  }

  console.log(files)

  return (
    <div className="text-white font-dm-serif flex flex-col lg:flex-row h-screen p-2 sm:p-3 gap-2 sm:gap-3">
      <div className="w-full lg:w-1/3 h-1/3 lg:h-full">
        <div className="border border-white rounded-lg p-2 sm:p-3 h-full flex flex-col justify-between">
          <div className="flex items-center justify-center mb-1 sm:mb-3 flex-col gap-1 sm:gap-3">
            <div className="text-lg sm:text-2xl font-bold font-berkshire flex items-center gap-2">
              IngestLoom
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