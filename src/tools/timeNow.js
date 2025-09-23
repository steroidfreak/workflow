import { tool } from '@openai/agents';
import { z } from 'zod';

export const timeNow = tool({
  name: 'time_now',
  description: 'Return the current date and time. Optionally accepts an IANA timezone and locale.',
  parameters: z
    .object({
      timezone: z
        .string()
        .min(1)
        .describe('IANA timezone identifier such as "Asia/Singapore".')
        .nullish(),
      locale: z
        .string()
        .min(2)
        .describe('BCP 47 locale tag controlling phrasing, default en-US.')
        .nullish(),
    })
    .strict(),
  strict: true,
  async execute({ timezone, locale }) {
    const now = new Date();

    try {
      const formatter = new Intl.DateTimeFormat(locale ?? 'en-US', {
        timeZone: timezone ?? 'UTC',
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      });

      return formatter.format(now);
    } catch (error) {
      const isoTimestamp = now.toISOString();
      if (timezone) {
        return `Unable to format using timezone "${timezone}". Current UTC time: ${isoTimestamp}`;
      }

      return isoTimestamp;
    }
  },
});
