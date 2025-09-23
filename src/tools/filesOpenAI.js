import OpenAI from 'openai';
import { tool } from '@openai/agents';
import { z } from 'zod';

function createClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function openAiFileSearchTool() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY must be set to enable the OpenAI file search tool.');
  }

  const vectorStoreId = process.env.VECTOR_STORE_ID;
  if (!vectorStoreId) {
    throw new Error('VECTOR_STORE_ID must be set when USE_OPENAI_FILE_TOOL is true.');
  }

  const client = createClient();

  return tool({
    name: 'openai_file_search',
    description: 'Search indexed documents hosted in an OpenAI vector store and summarize relevant passages.',
    parameters: z
      .object({
        query: z.string().min(3, 'Provide a natural language search query.'),
        max_results: z
          .number()
          .int()
          .min(1)
          .max(5)
          .describe('Maximum number of passages to retrieve.')
          .nullish()
          .default(3),
      })
      .strict(),
    strict: true,
    async execute({ query, max_results }) {
      const maxResults = max_results ?? 3;
      const response = await client.responses.create({
        model: process.env.FILE_SEARCH_MODEL ?? 'gpt-4.1-mini',
        input: [{ role: 'user', content: query }],
        tools: [{ type: 'file_search' }],
        tool_resources: {
          file_search: {
            vector_store_ids: [vectorStoreId],
            max_chunks: maxResults,
          },
        },
        max_output_tokens: 600,
      });

      const output = response.output_text?.trim();
      return output && output.length > 0 ? output : 'No matching passages were found for that query.';
    },
  });
}
