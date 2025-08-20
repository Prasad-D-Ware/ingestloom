import openai from "@/lib/openai";
import { NextResponse } from "next/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";

export const runtime = "nodejs";


export async function POST(req: Request) {
  const { messages, userId } = await req.json();

  // console.log(messages,"messages")
  // console.log(userId,"userId")

  // Fallback to plain chat if missing inputs
  if (!Array.isArray(messages) || !messages.length) {
    // console.log("messages is empty")
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages || [],
      stream: true,
    });

    // Create a readable stream for the fallback response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          }
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  const lastUserMessage = [...messages].reverse().find((m: any) => m.role === "user");
  const userQuery: string = lastUserMessage?.content || "";

  let retrievedContext = "";
  try {
    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-large",
      batchSize: 10,
    });

    const qdrantConfig: any = {
      url: process.env.QDRANT_URL || "http://localhost:6333",
      collectionName: process.env.QDRANT_COLLECTION || "ingestloom-uploads",
    };
    
    // Add API key if provided
    if (process.env.QDRANT_API_KEY) {
      qdrantConfig.apiKey = process.env.QDRANT_API_KEY;
    }
    
    const store = await QdrantVectorStore.fromExistingCollection(embeddings, qdrantConfig);

    let docs: any[] = [];
    if (userQuery) {
      const filterUserId = userId
        ? { must: [{ key: "userId", match: { value: userId } }] }
        : undefined;
      docs = await store.similaritySearch(userQuery, 6, filterUserId as any);
      // console.log({ count_userId_key: docs.length });

      // If none found, try nested metadata key variant
      if ((!docs || docs.length === 0) && userId) {
        const filterMetaUserId = { must: [{ key: "metadata.userId", match: { value: userId } }] };
        docs = await store.similaritySearch(userQuery, 6, filterMetaUserId as any);
        // console.log({ count_metadata_userId_key: docs.length });
      }

      if (!docs || docs.length === 0) {
        const allDocs = await store.similaritySearch(userQuery, 6);
        // console.log({ count_unfiltered: allDocs.length });
        if (allDocs && allDocs.length > 0) {
          docs = allDocs;
        }
      }
    }

    // console.log(docs, "docs");
    retrievedContext = JSON.stringify(
      (docs || []).map((d: any) => ({
        content: d.pageContent,
        metadata: d.metadata,
      }))
    );
  } catch (err : any) {
    console.log("Error Occured in retrieval", err.message) 
  }

  // console.log(retrievedContext,"retrievedContext")

  const systemPrompt = `You are a helpful AI assistant. Use the following CONTEXT, if relevant, to answer the user. If the context is not relevant, answer normally. Keep answers concise, and Always cite filenames or page numbers from metadata.\n\nCONTEXT:\n${retrievedContext}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    stream: true,
  });

  // Create a readable stream for the response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of response) {
          const data = `data: ${JSON.stringify(chunk)}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        }
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}