import OpenAI from "openai";

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (openaiClient) {
    return openaiClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  openaiClient = new OpenAI({
    apiKey: apiKey,
  });

  return openaiClient;
}

export interface CreateVectorStoreParams {
  name: string;
  description?: string;
}

export interface VectorStore {
  id: string;
  name: string;
  status: string;
  created_at: number;
  file_counts?: {
    in_progress: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
}

/**
 * Create a new vector store
 */
export async function createVectorStore(
  params: CreateVectorStoreParams,
): Promise<VectorStore> {
  const client = getOpenAIClient();

  const vectorStore = await (client.beta as any).vectorStores.create({
    name: params.name,
    description: params.description,
  });

  return vectorStore as VectorStore;
}

/**
 * Get a vector store by ID
 */
export async function getVectorStore(
  vectorStoreId: string,
): Promise<VectorStore | null> {
  try {
    const client = getOpenAIClient();
    const vectorStore = await (client.beta as any).vectorStores.retrieve(vectorStoreId);
    return vectorStore as VectorStore;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Update a vector store
 */
export async function updateVectorStore(
  vectorStoreId: string,
  params: Partial<CreateVectorStoreParams>,
): Promise<VectorStore> {
  const client = getOpenAIClient();

  const vectorStore = await (client.beta as any).vectorStores.update(vectorStoreId, {
    name: params.name,
    description: params.description,
  });

  return vectorStore as VectorStore;
}

/**
 * Delete a vector store
 */
export async function deleteVectorStore(
  vectorStoreId: string,
): Promise<void> {
  const client = getOpenAIClient();
  await (client.beta as any).vectorStores.del(vectorStoreId);
}

/**
 * Upload a file to OpenAI and add it to a vector store
 */
export async function uploadFileToVectorStore(
  vectorStoreId: string,
  file: Buffer,
  fileName: string,
): Promise<string> {
  const client = getOpenAIClient();

  // Create a File object from the buffer
  // Node.js 18+ has File API built-in
  // If File is not available, we'll create a compatible object
  let fileObj: File | any;
  
  if (typeof File !== "undefined") {
    // Use native File API if available (Node.js 18+)
    fileObj = new File([file], fileName, {
      type: "application/octet-stream",
    });
  } else {
    // Fallback for older Node.js versions
    // Create a File-like object that OpenAI SDK can use
    const { Readable } = require("stream");
    fileObj = {
      name: fileName,
      type: "application/octet-stream",
      stream: () => Readable.from([file]),
      arrayBuffer: async () => {
        const ab = new ArrayBuffer(file.length);
        const view = new Uint8Array(ab);
        for (let i = 0; i < file.length; i++) {
          view[i] = file[i];
        }
        return ab;
      },
    };
  }

  // Upload file to OpenAI
  const uploadedFile = await client.files.create({
    file: fileObj as any,
    purpose: "assistants",
  });

  // Add file to vector store
  await (client.beta as any).vectorStores.files.create(vectorStoreId, {
    file_id: uploadedFile.id,
  });

  return uploadedFile.id;
}

/**
 * Upload a file from a URL (for website content)
 */
export async function uploadUrlToVectorStore(
  vectorStoreId: string,
  url: string,
): Promise<string> {
  const client = getOpenAIClient();

  // Fetch the content from the URL
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.statusText}`);
  }

  const content = await response.text();
  const fileName = new URL(url).pathname.split("/").pop() || "content.txt";

  // Convert content to buffer
  const buffer = Buffer.from(content, "utf-8");

  // Upload to vector store
  return uploadFileToVectorStore(vectorStoreId, buffer, fileName);
}

/**
 * List files in a vector store
 */
export async function listVectorStoreFiles(
  vectorStoreId: string,
): Promise<any[]> {
  const client = getOpenAIClient();

  const files = await (client.beta as any).vectorStores.files.list(vectorStoreId);
  return files.data;
}

/**
 * Remove a file from a vector store
 */
export async function removeFileFromVectorStore(
  vectorStoreId: string,
  fileId: string,
): Promise<void> {
  const client = getOpenAIClient();
  await (client.beta as any).vectorStores.files.del(vectorStoreId, fileId);
}

