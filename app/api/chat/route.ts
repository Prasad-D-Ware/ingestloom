import openai from "@/lib/openai";
import { NextResponse } from "next/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";

export const runtime = "nodejs";


export async function POST(req: Request) {
  const { messages, userId } = await req.json();

  if (!Array.isArray(messages) || !messages.length) {
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
  try{
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
    batchSize: 10,
  })

  const qdrantConfig: any = {
    url: process.env.QDRANT_URL || "http://localhost:6333",
    collectionName: "ingestloom-uploads"
  };
  if (process.env.QDRANT_API_KEY) {
    qdrantConfig.apiKey = process.env.QDRANT_API_KEY;
  }
  const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, qdrantConfig);

  const retrieverOptions: any = { k: 6 };
  if (userId) {
    retrieverOptions.filter = {
      must: [
        {
          key: "metadata.userId",
          match: { value: userId },
        },
      ],
    };
  }
  let relevantChunks: any[] = []
  try {
    const vectorRetriever = vectorStore.asRetriever(retrieverOptions);
    relevantChunks = await vectorRetriever.invoke(userQuery);
  } catch (e) {
    // Fallbacks for potential filter key mismatch or invalid value
    try {
      if (userId) {
        const altRetriever = vectorStore.asRetriever({ k: 6, filter: { must: [{ key: "userId", match: { value: userId } }] } });
        relevantChunks = await altRetriever.invoke(userQuery);
      } else {
        const unfilteredRetriever = vectorStore.asRetriever({ k: 6 });
        relevantChunks = await unfilteredRetriever.invoke(userQuery);
      }
    } catch (e2) {
      const unfilteredRetriever = vectorStore.asRetriever({ k: 6 });
      relevantChunks = await unfilteredRetriever.invoke(userQuery);
    }
  }

    retrievedContext = JSON.stringify(
      (relevantChunks || []).map((d: any) => ({
        content: d.pageContent,
        metadata: d.metadata,
      }))
    );
  } catch (err : any) {
    console.log("Error Occured in retrieval", err.message) 
  }

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