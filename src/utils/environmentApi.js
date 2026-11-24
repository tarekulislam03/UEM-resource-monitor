export async function fetchWeather(lat, lng) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
    lat
  )}&longitude=${encodeURIComponent(
    lng
  )}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,precipitation&timezone=auto`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Weather request failed (${res.status})`);
    }
    const data = await res.json();
    if (!data || !data.current) {
      throw new Error('Weather data unavailable.');
    }
    return data.current;
  } catch (err) {
    throw new Error(err?.message || 'Unable to fetch weather data.');
  }
}

export async function fetchAirQuality(lat, lng) {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${encodeURIComponent(
    lat
  )}&longitude=${encodeURIComponent(
    lng
  )}&current=us_aqi,pm2_5,pm10&timezone=auto`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Air quality request failed (${res.status})`);
    }
    const data = await res.json();
    if (!data || !data.current) {
      throw new Error('Air quality data unavailable.');
    }
    return data.current;
  } catch (err) {
    throw new Error(err?.message || 'Unable to fetch air quality data.');
  }
}
