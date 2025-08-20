import path from "path"
import { readdir, stat, readFile as fsReadFile, writeFile as fsWriteFile } from "fs/promises"
import crypto from "crypto"
import { v5 as uuidv5 } from "uuid"

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv"
import { OpenAIEmbeddings } from "@langchain/openai"
import { QdrantVectorStore } from "@langchain/qdrant"

type IndexOptions = {
  qdrantUrl?: string
  collectionName?: string
}

function getEnv(name: string, fallback?: string): string | undefined {
  const value = process.env[name]
  return value ?? fallback
}

async function loadDocumentsForFile(fileAbsolutePath: string) {
  const lower = fileAbsolutePath.toLowerCase()
  let docs: any[] = []
  if (lower.endsWith(".pdf")) {
    const loader = new PDFLoader(fileAbsolutePath)
    docs = await loader.load()
  } else if (lower.endsWith(".txt") || lower.endsWith(".md")) {
    const loader = new TextLoader(fileAbsolutePath)
    docs = await loader.load()
  } else if (lower.endsWith(".csv")) {
    const loader = new CSVLoader(fileAbsolutePath)
    docs = await loader.load()
  } else {
    return []
  }

  for (const d of docs) {
    d.metadata = {
      ...(d.metadata || {}),
      source: fileAbsolutePath,
      filename: path.basename(fileAbsolutePath),
    }
  }
  return docs
}

type ManifestEntry = {
  mtimeMs: number
  size: number
  hash: string
}

async function readManifest(userDir: string): Promise<Record<string, ManifestEntry>> {
  const manifestPath = path.join(userDir, ".ingest-manifest.json")
  try {
    const raw = await fsReadFile(manifestPath, "utf8")
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function writeManifest(userDir: string, data: Record<string, ManifestEntry>) {
  const manifestPath = path.join(userDir, ".ingest-manifest.json")
  await fsWriteFile(manifestPath, JSON.stringify(data, null, 2), "utf8")
}

// Stable namespace for generating deterministic UUIDv5 identifiers
const UUID_NAMESPACE = uuidv5("ingestloom-qdrant", uuidv5.DNS)

function stableIdForDoc(userId: string, relativeSourcePath: string, indexWithinFile: number): string {
  const name = `${userId}:${relativeSourcePath}:${indexWithinFile}`
  return uuidv5(name, UUID_NAMESPACE)
}

export async function indexUserUploads(userId: string, options: IndexOptions = {}) {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", userId)

  const qdrantUrl = options.qdrantUrl || getEnv("QDRANT_URL", "http://localhost:6333") || "http://localhost:6333"
  const collectionName = options.collectionName || getEnv("QDRANT_COLLECTION", "ingestloom-uploads") || "ingestloom-uploads"

  const openaiKey = getEnv("OPENAI_API_KEY")
  if (!openaiKey) {
    console.warn("OPENAI_API_KEY not set; skipping vector indexing")
    return { indexed: false, reason: "missing_openai_key" }
  }

  const files = await readdir(uploadsDir).catch(() => [])
  if (!files.length) {
    return { indexed: false, reason: "no_files" }
  }

  const absolutePaths = files.map((f) => path.join(uploadsDir, f))

  // Read manifest to skip unchanged files
  const manifest = await readManifest(uploadsDir)
  const filesToProcess: string[] = []
  const nextManifest: Record<string, ManifestEntry> = { ...manifest }
  let manifestUpdatedWithoutIndexing = false
  for (const filePath of absolutePaths) {
    try {
      const s = await stat(filePath)
      const key = path.basename(filePath)
      const prev = manifest[key]
      // Fast path: if stat unchanged compared to manifest, skip without reading
      if (prev && prev.mtimeMs === s.mtimeMs && prev.size === s.size) {
        continue
      }
      // Compute content hash to verify real change
      const fileBuffer = await fsReadFile(filePath)
      const contentHash = crypto.createHash("sha1").update(fileBuffer).digest("hex")
      if (prev && prev.hash === contentHash) {
        // Content same, just update manifest with new stat
        nextManifest[key] = { mtimeMs: s.mtimeMs, size: s.size, hash: contentHash }
        manifestUpdatedWithoutIndexing = true
        continue
      }
      filesToProcess.push(filePath)
      nextManifest[key] = { mtimeMs: s.mtimeMs, size: s.size, hash: contentHash }
    } catch {
      // If we cannot stat, skip file
    }
  }

  if (!filesToProcess.length) {
    if (manifestUpdatedWithoutIndexing) {
      await writeManifest(uploadsDir, nextManifest)
    }
    return { indexed: false, reason: "no_changes" }
  }

  const docsNested = await Promise.all(filesToProcess.map((p) => loadDocumentsForFile(p)))
  const docs = docsNested.flat()
  if (!docs.length) {
    return { indexed: false, reason: "no_supported_docs" }
  }

  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
    batchSize: 10,
    apiKey: openaiKey,
  })

  // Create or connect to existing collection and upsert with stable IDs
  const store = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: qdrantUrl,
    collectionName,
  })

  // Build stable IDs to make upserts idempotent
  const ids: string[] = []
  let cursor = 0
  for (let i = 0; i < docsNested.length; i++) {
    const filePath = filesToProcess[i]
    const rel = path.relative(uploadsDir, filePath)
    const docsInFile = docsNested[i]
    for (let j = 0; j < docsInFile.length; j++) {
      ids[cursor++] = stableIdForDoc(userId, rel, j)
    }
  }

  await store.addDocuments(docs as any, { ids })

  // Persist updated manifest after successful upsert
  await writeManifest(uploadsDir, nextManifest)

  return { indexed: true, reason: "ok", count: docs.length, collectionName }
}


