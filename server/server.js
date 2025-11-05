import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3001;

const app = express();

app.use(cors());
app.use(express.json());

// --- Mock quotes for /api/quote ---
const QUOTES = [
	{ author: "Nelson Mandela", text: "The greatest glory in living lies not in never falling, but in rising every time we fall." },
	{ author: "Walt Disney", text: "The way to get started is to quit talking and begin doing." },
	{ author: "Eleanor Roosevelt", text: "The future belongs to those who believe in the beauty of their dreams." },
	{ author: "Steve Jobs", text: "Stay hungry, stay foolish." },
	{ author: "Confucius", text: "It does not matter how slowly you go as long as you do not stop." }
];

// Helper: pick random item
function randomItem(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

// --- Routes ---

// Quote endpoint: try external API (if configured) then fall back to mock quotes
app.get('/api/quote', async (req, res) => {
	const externalApi = process.env.QUOTE_API_URL || process.env.QUOTABLE_API_URL;

	if (externalApi) {
		try {
			// Normalize common case: if user provided a base quotable URL, append /random
			let url = externalApi;
			if (externalApi.includes('quotable.io') && !externalApi.endsWith('/random')) {
				url = externalApi.replace(/\/+$/, '') + '/random';
			}

			const response = await axios.get(url, { timeout: 5000 });
			const data = response.data;

			// Map common response shapes to { text, author }
			let quoteObj = null;
			if (data) {
				if (data.content && data.author) {
					// quotable.io -> { content, author }
					quoteObj = { text: data.content, author: data.author };
				} else if (data.quote && data.author) {
					// other APIs -> { quote, author }
					quoteObj = { text: data.quote, author: data.author };
				} else if (Array.isArray(data.results) && data.results.length > 0) {
					const item = data.results[0];
					quoteObj = { text: item.content || item.quote || item.text, author: item.author || item.authorName };
				}
			}

			if (quoteObj) {
				return res.json({ quote: quoteObj, source: 'external' });
			}

			console.warn('External quote API returned unexpected shape, falling back to mock');
		} catch (err) {
			console.error('External quote fetch failed:', err.message || err);
			// continue to fallback below
		}
	}

	// Fallback: return a random mock quote
	const quote = randomItem(QUOTES);
	res.json({ quote, source: 'mock' });
});

// Weather endpoint: accepts optional `city` query (defaults to London)
app.get('/api/weather', async (req, res) => {
	const city = req.query.city || 'London';
	const apiKey = process.env.OPENWEATHER_API_KEY;

	if (!apiKey) {
		return res.status(500).json({ error: 'Weather API key not configured on the server.' });
	}

	try {
		const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
		const response = await axios.get(url);
		const data = response.data;

		// Simplify the response
		const simplified = {
			city: data.name,
			temperature: data.main?.temp,
			description: data.weather && data.weather[0] ? data.weather[0].description : undefined,
			raw: { /* optional: include raw for debugging if needed */ }
		};

		res.json(simplified);
	} catch (err) {
		// Improve error handling for common cases (invalid API key / unauthorized)
		const status = err.response?.status;
		const msg = err.response?.data?.message || err.message || 'Unknown error';

		if (status === 401) {
			console.error('Error fetching weather (401):', msg);
			return res.status(502).json({ error: 'Invalid or unauthorized OpenWeather API key. Please check your OPENWEATHER_API_KEY.' });
		}

		if (status) {
			console.error(`Error fetching weather (${status}):`, msg);
			return res.status(502).json({ error: `OpenWeather API error (status ${status}): ${msg}` });
		}

		console.error('Error fetching weather:', err.message || err);
		res.status(500).json({ error: 'Could not fetch weather data.' });
	}
});

// Debug route: indicate which API keys are present (boolean flags only)
app.get('/api/config', (req, res) => {
	res.json({
		openWeatherKeyPresent: !!process.env.OPENWEATHER_API_KEY,
		exchangeRateKeyPresent: !!process.env.EXCHANGE_RATE_API_KEY,
		quoteApiUrlPresent: !!(process.env.QUOTE_API_URL || process.env.QUOTABLE_API_URL)
	});
});

// Currency endpoint: accepts `amount` query param (INR amount) and returns USD/EUR conversions
app.get('/api/currency', async (req, res) => {
	const amount = parseFloat(req.query.amount) || 1;
	const apiKey = process.env.EXCHANGE_RATE_API_KEY; // optional

	try {
		let rates;

		if (apiKey) {
			// Example for ExchangeRate-API (v6): https://www.exchangerate-api.com/
			const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/INR`;
			const response = await axios.get(url);
			rates = response.data.conversion_rates;
		} else {
			// Fallback: use exchangerate.host (no API key required)
			const url = `https://api.exchangerate.host/latest?base=INR&symbols=USD,EUR`;
			const response = await axios.get(url);
			rates = response.data.rates;
		}

		if (!rates) {
			throw new Error('No rates returned from exchange API');
		}

		const usdRate = rates.USD;
		const eurRate = rates.EUR;

		if (usdRate == null || eurRate == null) {
			throw new Error('Missing USD or EUR rate from exchange API');
		}

		const result = {
			amountINR: amount,
			usd: +(amount * usdRate).toFixed(4),
			eur: +(amount * eurRate).toFixed(4),
			ratesSource: apiKey ? 'exchangerate-api.com' : 'exchangerate.host'
		};

		res.json(result);
	} catch (err) {
		console.error('Error fetching currency rates:', err.message || err);
		res.status(500).json({ error: 'Could not fetch currency conversion data.' });
	}
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// remove app.listen from here and export the app for local start + serverless wrappers
export default app;