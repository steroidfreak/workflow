import 'dotenv/config';
import { Agent, setDefaultModelProvider } from '@openai/agents';
import { OpenAIProvider, setDefaultOpenAIKey } from '@openai/agents-openai';
import { timeNow } from './tools/timeNow.js';
import { getWeather } from './tools/getWeather.js';
import { localFilesTool } from './tools/filesLocal.js';
import { openAiFileSearchTool } from './tools/filesOpenAI.js';

const tools = [timeNow, getWeather];

if (process.env.OPENAI_API_KEY) {
  setDefaultOpenAIKey(process.env.OPENAI_API_KEY);
  setDefaultModelProvider(new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY }));
}

if (process.env.USE_OPENAI_FILE_TOOL === 'true') {
  try {
    tools.push(await openAiFileSearchTool());
  } catch (error) {
    console.warn('Falling back to local file tool because OpenAI file search failed to initialize.', error);
    tools.push(localFilesTool);
  }
} else {
  tools.push(localFilesTool);
}

const model = process.env.MODEL || 'gpt-5';

export const agent = new Agent({
  name: 'Modular Chatbot',
  instructions: [
    'You are a concise, helpful assistant.',
    'If the user asks about content from files, prefer using the file tool.',
    'Cite filenames when answering from files.',
  ].join(' '),
  model,
  tools,
  reasoning: { effort: 'low' },
  verbosity: 'low',
});
