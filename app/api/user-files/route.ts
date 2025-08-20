import { NextResponse } from "next/server";
import path from "path";
import { readdir, stat, readFile } from "fs/promises";

function sanitizeUserId(input: string | null | undefined): string {
  if (!input) return "anonymous";
  const cleaned = input.replace(/[^a-zA-Z0-9\-_]/g, "");
  return cleaned || "anonymous";
}

type FileInfo = {
  name: string;
  type: 'document' | 'text' | 'crawl';
  uploadDate: string;
  size: number;
  originalUrl?: string;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = sanitizeUserId(url.searchParams.get("userId"));

    // Use /tmp directory for serverless environments (Vercel, AWS Lambda, etc.)
    // Note: Files in /tmp are temporary and will be lost between function invocations
    const baseDir = process.env.NODE_ENV === 'production' 
      ? path.join("/tmp", "uploads")
      : path.join(process.cwd(), "public", "uploads")
    const userDir = path.join(baseDir, userId);
    
    let files: string[] = [];
    try {
      files = await readdir(userDir);
    } catch (error) {
      // Directory doesn't exist or is empty
      return NextResponse.json({
        success: true,
        userId,
        files: [],
        totalFiles: 0
      });
    }

    const fileInfos: FileInfo[] = [];
    
    for (const fileName of files) {
      try {
        // Skip metadata files and other internal files
        if (fileName.endsWith('.meta.json') || fileName.startsWith('.')) {
          continue;
        }

        const filePath = path.join(userDir, fileName);
        const stats = await stat(filePath);
        
        let fileInfo: FileInfo = {
          name: fileName,
          type: 'document',
          uploadDate: stats.mtime.toISOString(),
          size: stats.size
        };

        // Determine file type based on naming convention
        if (fileName.startsWith('text-')) {
          fileInfo.type = 'text';
          fileInfo.name = 'Text Data';
        } else if (fileName.startsWith('crawl-')) {
          fileInfo.type = 'crawl';
          
          // Try to read metadata to get original URL
          const metadataPath = path.join(userDir, `${fileName}.meta.json`);
          try {
            const metadataContent = await readFile(metadataPath, 'utf-8');
            const metadata = JSON.parse(metadataContent);
            fileInfo.originalUrl = metadata.originalUrl;
            
            // Extract domain name from URL for display
            const urlObj = new URL(metadata.originalUrl);
            fileInfo.name = urlObj.hostname.replace('www.', '');
          } catch {
            // Fallback if metadata doesn't exist
            fileInfo.name = 'Crawled Website';
          }
        } else {
          fileInfo.type = 'document';
        }

        fileInfos.push(fileInfo);
      } catch (error) {
        console.error(`Error processing file ${fileName}:`, error);
        // Skip files that can't be processed
      }
    }

    // Sort by upload date (newest first)
    fileInfos.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

    return NextResponse.json({
      success: true,
      userId,
      files: fileInfos,
      totalFiles: fileInfos.length
    });

  } catch (error: any) {
    console.error("Error fetching user files:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Failed to fetch user files" 
      }, 
      { status: 500 }
    );
  }
}
