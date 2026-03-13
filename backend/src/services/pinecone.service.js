import { Pinecone } from "@pinecone-database/pinecone";

function getIndex() {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX;
  const namespace = process.env.PINECONE_NAMESPACE || "default";

  if (!apiKey || !indexName) return { index: null, namespace };

  const pinecone = new Pinecone({ apiKey });
  return { index: pinecone.index(indexName), namespace };
}

export async function upsertVectors(chunks, embeddings, metadata = {}) {
  const { index, namespace } = getIndex();
  if (!index) return;

  const records = chunks.map((text, i) => ({
    id: `${metadata.sourceType || "doc"}-${Date.now()}-${i}`,
    values: embeddings[i],
    metadata: { text, ...metadata }
  }));

  await index.namespace(namespace).upsert(records);
}

export async function queryVectors(vector) {
  const { index, namespace } = getIndex();
  if (!index) return [];

  const response = await index.namespace(namespace).query({
    vector,
    topK: 5,
    includeMetadata: true
  });

  return response.matches || [];
}