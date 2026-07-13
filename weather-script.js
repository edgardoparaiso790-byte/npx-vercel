// Weather Dashboard Application
// Uses OpenWeatherMap API (free tier)

// API Configuration
const API_KEY = 'YOUR_API_KEY_HERE'; // Get free key from https://openweathermap.org/api
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const currentWeather = document.getElementById('currentWeather');
const forecastSection = document.getElementById('forecastSection');
const recentSearches = document.getElementById('recentSearches');
const recentList = document.getElementById('recentList');

// Local Storage
const STORAGE_KEY = 'weatherDashboardSearches';
const MAX_RECENT_SEARCHES = 5;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    searchBtn.addEventListener('click', handleSearch);
    locationBtn.addEventListener('click', handleGeolocation);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    loadRecentSearches();
    loadDefaultCity();
});

/**
 * Load recent searches from localStorage
 */
function loadRecentSearches() {
    const searches = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    if (searches.length === 0) {
        recentSearches.classList.add('hidden');
        return;
    }

    recentSearches.classList.remove('hidden');
    recentList.innerHTML = searches
        .map(city => `
            <button class="recent-item" onclick="searchCity('${city}')">
                ${city}
            </button>
        `)
        .join('');
}

/**
 * Save search to localStorage
 */
function saveSearch(city) {
    let searches = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    // Remove if already exists
    searches = searches.filter(s => s.toLowerCase() !== city.toLowerCase());
    
    // Add to beginning
    searches.unshift(city);
    
    // Keep only recent searches
    searches = searches.slice(0, MAX_RECENT_SEARCHES);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
    loadRecentSearches();
}

/**
 * Load default city on first visit
 */
function loadDefaultCity() {
    const searches = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (searches.length > 0) {
        searchCity(searches[0]);
    }
}

/**
 * Handle search form submission
 */
function handleSearch() {
    const city = searchInput.value.trim();
    if (city) {
        searchCity(city);
        searchInput.value = '';
    }
}

/**
 * Search weather by city name
 */
async function searchCity(city) {
    try {
        showLoading();
        
        // Get coordinates from city name
        const geoResponse = await fetch(
            `${GEO_URL}/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`
        );
        
        if (!geoResponse.ok) {
            throw new Error('City not found');
        }
        
        const geoData = await geoResponse.json();
        
        if (geoData.length === 0) {
            throw new Error('City not found');
        }
        
        const { lat, lon, name, country } = geoData[0];
        
        // Fetch weather data
        await fetchWeather(lat, lon, `${name}, ${country}`);
        
        // Save to recent searches
        saveSearch(name);
        
        hideLoading();
    } catch (error) {
        showError(`Error: ${error.message}. Please check the city name and try again.`);
    }
}

/**
 * Handle geolocation
 */
function handleGeolocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }

    showLoading();
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeather(latitude, longitude, 'Current Location');
        },
        (error) => {
            showError(`Geolocation error: ${error.message}`);
        }
    );
}

/**
 * Fetch weather data from API
 */
async function fetchWeather(lat, lon, locationName) {
    try {
        // Current weather
        const weatherResponse = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        
        if (!weatherResponse.ok) {
            throw new Error('Failed to fetch weather data');
        }
        
        const weatherData = await weatherResponse.json();
        
        // Forecast
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        
        const forecastData = await forecastResponse.json();
        
        // Display data
        displayCurrentWeather(weatherData, locationName);
        displayForecast(forecastData);
        
        hideLoading();
    } catch (error) {
        showError(`Error fetching weather: ${error.message}`);
    }
}

/**
 * Display current weather
 */
function displayCurrentWeather(data, locationName) {
    const { main, weather, wind, clouds, visibility, sys, dt } = data;
    
    const temp = Math.round(main.temp);
    const feelsLike = Math.round(main.feels_like);
    const description = weather[0].main;
    const icon = weather[0].icon;
    
    const date = new Date(dt * 1000);
    const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const sunrise = new Date(sys.sunrise * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    
    const sunset = new Date(sys.sunset * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    
    // Update DOM
    document.getElementById('cityName').textContent = locationName;
    document.getElementById('currentDate').textContent = dateStr;
    document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${icon}@4x.png`;
    document.getElementById('temperature').textContent = temp;
    document.getElementById('weatherDescription').textContent = description;
    document.getElementById('feelsLike').innerHTML = `Feels like: <span>${feelsLike}</span>°C`;
    document.getElementById('humidity').textContent = main.humidity;
    document.getElementById('windSpeed').textContent = wind.speed.toFixed(1);
    document.getElementById('pressure').textContent = main.pressure;
    document.getElementById('visibility').textContent = (visibility / 1000).toFixed(1);
    document.getElementById('sunrise').textContent = sunrise;
    document.getElementById('sunset').textContent = sunset;
    
    currentWeather.classList.remove('hidden');
}

/**
 * Display 5-day forecast
 */
function displayForecast(data) {
    const forecasts = {};
    
    // Group forecasts by day
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        
        if (!forecasts[date]) {
            forecasts[date] = {
                temps: [],
                icons: [],
                descriptions: [],
                date: date,
                dt: item.dt
            };
        }
        
        forecasts[date].temps.push(item.main.temp);
        forecasts[date].icons.push(item.weather[0].icon);
        forecasts[date].descriptions.push(item.weather[0].main);
    });
    
    // Create forecast cards for next 5 days
    const forecastGrid = document.getElementById('forecastGrid');
    forecastGrid.innerHTML = Object.values(forecasts)
        .slice(0, 5)
        .map(forecast => {
            const avgTemp = Math.round(forecast.temps.reduce((a, b) => a + b) / forecast.temps.length);
            const icon = forecast.icons[Math.floor(forecast.icons.length / 2)];
            const description = forecast.descriptions[Math.floor(forecast.descriptions.length / 2)];
            
            return `
                <div class="forecast-card">
                    <div class="forecast-date">${forecast.date}</div>
                    <img src="https://openweathermap.org/img/wn/${icon}@2x.png" 
                         alt="weather icon" class="forecast-icon">
                    <div class="forecast-temp">${avgTemp}°C</div>
                    <div class="forecast-desc">${description}</div>
                </div>
            `;
        })
        .join('');
    
    forecastSection.classList.remove('hidden');
}

/**
 * Show loading state
 */
function showLoading() {
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    currentWeather.classList.add('hidden');
    forecastSection.classList.add('hidden');
}

/**
 * Hide loading state
 */
function hideLoading() {
    loadingState.classList.add('hidden');
}

/**
 * Show error message
 */
function showError(message) {
    errorMessage.textContent = message;
    errorState.classList.remove('hidden');
    loadingState.classList.add('hidden');
}
