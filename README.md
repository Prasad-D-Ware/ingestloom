# IngestLoom 🧠

**The SMARTEST/FASTEST RAG app you've ever used**

IngestLoom is a powerful Retrieval-Augmented Generation (RAG) application that allows you to seamlessly ingest, index, and chat with your documents, text data, and web content using AI.

## ✨ Features

- **Multi-format Document Support**: Upload and process PDF, TXT, MD, and CSV files
- **Web Crawling**: Extract and index content from any URL
- **Raw Text Input**: Directly input text data for indexing
- **AI-Powered Chat**: Chat with your ingested data using OpenAI's GPT models
- **Vector Search**: Powered by Qdrant for fast and accurate semantic search
- **User Isolation**: Each user gets their own data namespace
- **Smart Caching**: Incremental indexing only processes changed files
- **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- OpenAI API key
- Qdrant instance (local or cloud)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ingestloom
   ```

2. **Install dependencies**
   ```bash
   # Using npm
   npm install
   
   # Or using bun
   bun install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   QDRANT_URL=http://localhost:6333
   QDRANT_COLLECTION=ingestloom-uploads
   QDRANT_API_KEY=your_qdrant_api_key_if_using_cloud
   ```

4. **Start Qdrant (if running locally)**
   ```bash
   # Using Docker
   docker run -p 6333:6333 qdrant/qdrant
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

IngestLoom is built with modern technologies:

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI/ML**: OpenAI GPT-4o-mini, LangChain, OpenAI Embeddings
- **Vector Database**: Qdrant
- **File Processing**: PDF parsing, text extraction, web crawling
- **UI Components**: Radix UI, Lucide Icons

## 📁 Project Structure

```
ingestloom/
├── app/
│   ├── api/
│   │   ├── chat/           # Chat API with RAG
│   │   ├── ingest/         # File/text/URL ingestion
│   │   └── user-files/     # User file management
│   ├── dashboard/          # Main dashboard interface
│   └── page.tsx           # Landing page
├── components/
│   ├── ui/                # Reusable UI components
│   ├── chat-app.tsx       # Chat interface
│   ├── file-dropzone.tsx  # File upload component
│   └── hero-section.tsx   # Landing page hero
├── lib/
│   ├── indexer.ts         # Document processing and indexing
│   ├── openai.ts          # OpenAI client configuration
│   └── utils.ts           # Utility functions
└── public/uploads/        # User uploaded files storage
```

## 🔧 API Endpoints

### POST `/api/ingest`
Ingest files, text, or URLs for a user.

**Request**: 
- Multipart form data or JSON
- Fields: `files`, `text`, `url`, `userId`

**Response**:
```json
{
  "success": true,
  "userId": "user-uuid",
  "files": ["filename.pdf"],
  "text": "text-file.txt",
  "crawl": { "url": "https://example.com", "file": "crawl-file.txt" },
  "indexing": { "indexed": true, "count": 42 }
}
```

### POST `/api/chat`
Chat with ingested data using RAG.

**Request**:
```json
{
  "messages": [{"role": "user", "content": "What is this document about?"}],
  "userId": "user-uuid"
}
```

**Response**: Server-sent events stream with OpenAI response

### GET `/api/user-files`
Get all files for a user.

**Query Parameters**: `userId`

**Response**:
```json
{
  "success": true,
  "userId": "user-uuid",
  "files": [
    {
      "name": "document.pdf",
      "type": "document",
      "uploadDate": "2024-01-01T00:00:00.000Z",
      "size": 1024
    }
  ],
  "totalFiles": 1
}
```

## 🎯 Usage

1. **Visit the landing page** - See the animated hero section
2. **Go to Dashboard** - Click "Try Out Now"
3. **Ingest content**:
   - Upload files (PDF, TXT, MD, CSV)
   - Paste text directly
   - Enter URLs to crawl
   - Click "Ingest" to process
4. **Chat with your data** - Use the chat interface to ask questions about your ingested content

## 🔒 User Data Management

- Each user gets a unique UUID stored in localStorage
- Files are organized by user ID in the filesystem
- Vector embeddings include user metadata for filtered retrieval
- Incremental indexing prevents reprocessing unchanged files

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key (required) | - |
| `QDRANT_URL` | Qdrant instance URL | `http://localhost:6333` |
| `QDRANT_COLLECTION` | Qdrant collection name | `ingestloom-uploads` |
| `QDRANT_API_KEY` | Qdrant API key (for cloud) | - |

### Supported File Types

- **Documents**: PDF, TXT, MD, CSV
- **Text**: Direct text input
- **Web**: Any HTTP/HTTPS URL


**⚠️ Important Note for Production**: In serverless environments like Vercel, files are stored temporarily in `/tmp` and **will be lost between function invocations**. For production use, consider implementing cloud storage (AWS S3, Google Cloud Storage, etc.) for persistent file storage.

---

**IngestLoom** - Turning your documents into conversations. 🚀