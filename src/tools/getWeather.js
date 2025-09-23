import { tool } from '@openai/agents';
import { z } from 'zod';

const WEATHER_ENDPOINT = 'https://wttr.in';

function buildWeatherSummary(raw, units) {
  const current = raw?.current_condition?.[0];
  if (!current) {
    return 'No weather data was returned for that location.';
  }

  const temperature = units === 'imperial' ? `${current.temp_F}\u00B0F` : `${current.temp_C}\u00B0C`;
  const feelsLike = units === 'imperial' ? `${current.FeelsLikeF}\u00B0F` : `${current.FeelsLikeC}\u00B0C`;
  const description = current.weatherDesc?.[0]?.value ?? 'Unknown conditions';
  const humidity = current.humidity ? `${current.humidity}% humidity` : null;
  const windSpeed = (() => {
    if (units === 'imperial' && current.windspeedMiles) {
      return `${current.windspeedMiles} mph winds`;
    }
    if (current.windspeedKmph) {
      return `${current.windspeedKmph} km/h winds`;
    }
    return null;
  })();

  const pieces = [description, `Temperature ${temperature} (feels like ${feelsLike})`, humidity, windSpeed].filter(Boolean);
  return pieces.join('; ');
}

export const getWeather = tool({
  name: 'get_weather',
  description: 'Fetch the current weather for a city or location using the public wttr.in service.',
  parameters: z
    .object({
      location: z.string().min(2, 'Provide a location name (e.g., "Singapore" or "94105").'),
      units: z.enum(['metric', 'imperial']).nullish().default('metric'),
    })
    .strict(),
  strict: true,
  async execute({ location, units }) {
    const resolvedUnits = units ?? 'metric';
    const query = new URLSearchParams({ format: 'j1' });
    const url = `${WEATHER_ENDPOINT}/${encodeURIComponent(location)}?${query.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather service responded with status ${response.status}`);
    }

    const payload = await response.json();
    if (!payload || payload.data === 'Unknown location') {
      return `Weather data for "${location}" is not available right now.`;
    }

    return buildWeatherSummary(payload, resolvedUnits);
  },
});
