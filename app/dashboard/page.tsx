import ChatApp from "@/components/chat-app";
import { Textarea } from "@/components/ui/textarea";
import { Send, Upload } from "lucide-react";
import React from "react";

const DashboardPage = () => {
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
            />
            <div className="flex items-center justify-between self-end w-full flex-col sm:flex-row gap-1 sm:gap-0">
              <button className="text-xs sm:text-sm font-dm-serif flex items-center gap-2 border border-white rounded-lg p-1 sm:p-2 w-full sm:w-auto justify-center sm:justify-start hover:cursor-pointer">
                <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                Upload File
              </button>
              <button className="text-xs sm:text-sm font-dm-serif flex items-center gap-2 border border-white rounded-lg p-1 sm:p-2 w-full sm:w-auto justify-center sm:justify-start bg-white text-black font-semibold hover:cursor-pointer">
                Ingest
                <Send className="w-3 h-3 sm:w-4 sm:h-4" />
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
