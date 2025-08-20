import { NextResponse } from "next/server"
import { mkdir, writeFile } from "fs/promises"
import fs from "fs"
import path from "path"
import { indexUserUploads } from "@/lib/indexer"

export const runtime = "nodejs"

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
}

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function sanitizeUserId(input: string | null | undefined): string {
  const cleaned = (input || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100)
  return cleaned || "anonymous"
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData()
      const files = form.getAll("files") as File[]
      const text = (form.get("text") as string | null) || ""
      const url = (form.get("url") as string | null) || ""
      const userId = sanitizeUserId(form.get("userId") as string | null)

      const baseDir = path.join(process.cwd(), "public", "uploads")
      const userDir = path.join(baseDir, userId)
      await ensureDir(userDir)

      const savedFiles: string[] = []
      for (const file of files) {
        const bytes = Buffer.from(await file.arrayBuffer())
        const target = path.join(userDir, file.name)
        await writeFile(target, bytes)
        savedFiles.push(file.name)
      }

      let savedTextFile: string | null = null
      if (text && text.trim()) {
        const name = `text-${Date.now()}.txt`
        await writeFile(path.join(userDir, name), text)
        savedTextFile = name
      }

      let crawled: { url: string; file: string } | null = null
      if (url && /^https?:\/\//i.test(url)) {
        const res = await fetch(url)
        const html = await res.text()
        const txt = htmlToText(html)
        const name = `crawl-${Date.now()}.txt`
        await writeFile(path.join(userDir, name), txt)
        crawled = { url, file: name }
      }
      const indexingResult = await indexUserUploads(userId).catch((err) => {
        console.error("Indexing error:", err)
        return { indexed: false, reason: "error" }
      })

      return NextResponse.json({ success: true, userId, files: savedFiles, text: savedTextFile, crawl: crawled, indexing: indexingResult })
    } else {
      const body = await req.json().catch(() => ({} as any))
      const { text = "", url = "", userId: rawUserId } = body
      const userId = sanitizeUserId(rawUserId)

      const baseDir = path.join(process.cwd(), "public", "uploads")
      const userDir = path.join(baseDir, userId)
      await ensureDir(userDir)

      let savedTextFile: string | null = null
      if (text && text.trim()) {
        const name = `text-${Date.now()}.txt`
        await writeFile(path.join(userDir, name), text)
        savedTextFile = name
      }

      let crawled: { url: string; file: string } | null = null
      if (url && /^https?:\/\//i.test(url)) {
        const res = await fetch(url)
        const html = await res.text()
        const txt = htmlToText(html)
        const name = `crawl-${Date.now()}.txt`
        await writeFile(path.join(userDir, name), txt)
        crawled = { url, file: name }
      }
      const indexingResult = await indexUserUploads(userId).catch((err) => {
        console.error("Indexing error:", err)
        return { indexed: false, reason: "error" }
      })

      return NextResponse.json({ success: true, userId, files: [], text: savedTextFile, crawl: crawled, indexing: indexingResult })
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Unknown error" }, { status: 500 })
  }
}