console.log("ClimaWise Script Loaded");

const API_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const SAO_PAULO_LAT = -23.5505;
const SAO_PAULO_LON = -46.6333;

// Elementos da UI
const elements = {
    currentLocation: document.getElementById('current-location'),
    currentDatetime: document.getElementById('current-datetime'),
    currentWeatherIcon: document.getElementById('current-weather-icon'),
    currentTemp: document.getElementById('current-temp'),
    currentFeelsLike: document.getElementById('current-feels-like'),
    currentConditionText: document.getElementById('current-condition-text'),
    currentWind: document.getElementById('current-wind'),
    currentWindDirection: document.getElementById('current-wind-direction'),
    currentHumidity: document.getElementById('current-humidity'),
    currentPressure: document.getElementById('current-pressure'),
    currentUvIndex: document.getElementById('current-uv-index'),
    currentUvText: document.getElementById('current-uv-text'),
    uvColorIndicator: document.getElementById('uv-color-indicator'),
    currentAirQuality: document.getElementById('current-air-quality'), // Placeholder, API não fornece IQA diretamente
    sunriseTime: document.getElementById('sunrise-time'),
    sunsetTime: document.getElementById('sunset-time'),
    refreshButton: document.getElementById('refresh-button'),
    weatherAlertsBanner: document.getElementById('weather-alerts-banner'),
    alertMessage: document.getElementById('alert-message'),

    // Navigation
    navHome: document.getElementById('nav-home'),
    navForecast: document.getElementById('nav-forecast'),
    navSettings: document.getElementById('nav-settings'),
    screens: document.querySelectorAll('.screen'),

    // Extended Forecast
    forecastContainer: document.getElementById('forecast-container'),
    model00zButton: document.getElementById('model-00z'),
    model12zButton: document.getElementById('model-12z'),
    forecastDaysSelect: document.getElementById('forecast-days-select'),

    // Settings
    themeSelect: document.getElementById('theme-select'),
    tempCelsiusRadio: document.getElementById('temp-celsius'),
    tempFahrenheitRadio: document.getElementById('temp-fahrenheit'),
    pressureHpaRadio: document.getElementById('pressure-hpa'),
    pressureMbarRadio: document.getElementById('pressure-mbar'),
    windKmhRadio: document.getElementById('wind-kmh'),
    windMphRadio: document.getElementById('wind-mph'),
    defaultModelSelect: document.getElementById('default-model-select'),
};

let currentForecastModel = 'ecmwf_ifs04'; // Modelo padrão ECMWF IFS 0.4 graus. Open-Meteo não diferencia 00Z/12Z diretamente neste modelo.
                                        // A API usa o modelo ECMWF IFS que tem resolução de ~40km.
                                        // Para alternar entre "corridas" (00Z/12Z), normalmente se usaria um parâmetro específico se a API suportasse,
                                        // ou se houvesse modelos diferentes para cada corrida.
                                        // Para este prompt, a API Open-Meteo com `models=ecmwf_ifs04` já usa a corrida mais recente disponível.
                                        // A distinção 00Z/12Z no frontend será mais para simular a escolha,
                                        // mas os dados virão da mesma fonte `ecmwf_ifs04`.
                                        // Se quisermos simular uma diferença, podemos alterar ligeiramente a requisição ou apenas o visual.
                                        // Por simplicidade, a chamada à API será a mesma, mas o botão indicará a preferência do usuário.

let currentSettings = {
    theme: 'light-theme',
    units: {
        temp: '°C',
        pressure: 'hPa',
        wind: 'km/h'
    },
    forecastDays: 7,
    // selectedModelRun: '00Z' // Para o toggle visual
};


// Mapeamento de códigos de tempo (WMO) para ícones e descrições (simplificado)
// Estes códigos podem ser encontrados na documentação do Open-Meteo
const weatherCodes = {
    0: { description: "Céu limpo", icon: "clear-day.svg" },
    1: { description: "Principalmente limpo", icon: "partly-cloudy-day.svg" },
    2: { description: "Parcialmente nublado", icon: "partly-cloudy-day.svg" },
    3: { description: "Nublado", icon: "cloudy.svg" },
    45: { description: "Nevoeiro", icon: "fog.svg" },
    48: { description: "Nevoeiro depositando geada", icon: "fog.svg" },
    51: { description: "Chuvisco leve", icon: "drizzle.svg" },
    53: { description: "Chuvisco moderado", icon: "drizzle.svg" },
    55: { description: "Chuvisco intenso", icon: "drizzle.svg" },
    61: { description: "Chuva leve", icon: "rain.svg" },
    63: { description: "Chuva moderada", icon: "rain.svg" },
    65: { description: "Chuva forte", icon: "rain.svg" },
    80: { description: "Pancadas de chuva leves", icon: "showers.svg" },
    81: { description: "Pancadas de chuva moderadas", icon: "showers.svg" },
    82: { description: "Pancadas de chuva violentas", icon: "showers.svg" },
    95: { description: "Trovoada", icon: "thunderstorm.svg" },
    // Adicionar mais códigos conforme necessário
};

function getWeatherIconPath(code) {
    return `icons/${weatherCodes[code]?.icon || 'default.svg'}`;
}
function getWeatherDescription(code) {
    return weatherCodes[code]?.description || "Condição desconhecida";
}


async function fetchWeatherData(latitude, longitude) {
    // Parâmetros para a API, incluindo dados horários para "agora" e diários para nascer/pôr do sol etc.
    const params = new URLSearchParams({
        latitude: latitude,
        longitude: longitude,
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure",
        daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_mean", // Adicionado precipitation_probability_mean
        timezone: "America/Sao_Paulo",
        models: "ecmwf_ifs04", // Usando o modelo ECMWF especificado
        forecast_days: 1 // Para os dados "atuais" e do dia
    });

    // A API Open-Meteo não tem um endpoint específico para "pressão ao nível do mar" diretamente no 'current'.
    // 'surface_pressure' é a pressão na superfície. Para converter para MSL (nível do mar),
    // precisaríamos da altitude, o que complica. Usaremos surface_pressure por enquanto.
    // A qualidade do ar (IQA) não é fornecida diretamente por este endpoint básico do Open-Meteo.
    // Seria necessário um endpoint de qualidade do ar ou uma API separada.

    const url = `${API_BASE_URL}?${params.toString()}`;
    console.log("Fetching URL:", url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Weather Data Received:", data);
        return data;
    } catch (error) {
        console.error("Erro ao buscar dados da API:", error);
        elements.currentLocation.textContent = "Erro ao carregar dados";
        return null;
    }
}

function updateUI(data) {
    if (!data || !data.current || !data.daily) {
        elements.currentLocation.textContent = "Dados indisponíveis";
        return;
    }

    const { current, daily } = data;

    // Data e Hora
    const now = new Date(current.time * 1000); // O tempo da API é em segundos Unix
    elements.currentDatetime.textContent = now.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    // Localização (fixa por enquanto, poderia ser dinâmica no futuro)
    elements.currentLocation.textContent = "São Paulo, SP"; // Exemplo

    // Temperatura e Sensação
    let temp = current.temperature_2m;
    let apparentTemp = current.apparent_temperature;
    let tempUnitDisplay = currentSettings.units.temp;

    if (currentSettings.units.temp === '°F') {
        temp = (temp * 9/5) + 32;
        apparentTemp = (apparentTemp * 9/5) + 32;
    }
    elements.currentTemp.textContent = Math.round(temp);
    // Adicionar a unidade ao lado da temperatura principal
    if(elements.currentTemp.parentNode.querySelector('.temp-unit')) {
        elements.currentTemp.parentNode.querySelector('.temp-unit').textContent = tempUnitDisplay;
    }
    elements.currentFeelsLike.textContent = `Sensação: ${Math.round(apparentTemp)}${tempUnitDisplay}`;

    // Condição do Tempo
    const currentWeatherCode = current.weather_code;
    elements.currentWeatherIcon.src = getWeatherIconPath(currentWeatherCode);
    elements.currentWeatherIcon.alt = getWeatherDescription(currentWeatherCode);
    elements.currentConditionText.textContent = getWeatherDescription(currentWeatherCode);

    // Vento
    let windSpeed = current.wind_speed_10m;
    let windUnitDisplay = currentSettings.units.wind;
    if (currentSettings.units.wind === 'mph') {
        windSpeed = windSpeed * 0.621371;
    }
    elements.currentWind.textContent = `${Math.round(windSpeed)} ${windUnitDisplay}`;
    elements.currentWindDirection.textContent = getWindDirectionSymbol(current.wind_direction_10m);

    // Umidade
    elements.currentHumidity.textContent = `${current.relative_humidity_2m}%`;

    // Pressão (usando pressão da superfície)
    let pressure = current.surface_pressure / 100; // Convertendo de Pa para hPa (que é o mesmo que mbar)
    let pressureUnitDisplay = currentSettings.units.pressure;
    // Nenhuma conversão necessária entre hPa e mbar, apenas a exibição da unidade.
    elements.currentPressure.textContent = `${Math.round(pressure)} ${pressureUnitDisplay}`;

    // UV Index (do 'daily' - geralmente é um valor máximo para o dia)
    const uvIndex = daily.uv_index_max[0]; // Pega o primeiro dia (hoje)
    elements.currentUvIndex.textContent = uvIndex.toFixed(1);
    const { text: uvText, color: uvColor } = getUvDetails(uvIndex);
    elements.currentUvText.textContent = `(${uvText})`;
    elements.uvColorIndicator.style.backgroundColor = uvColor;
    elements.uvColorIndicator.title = uvText;


    // Qualidade do Ar (Placeholder)
    elements.currentAirQuality.textContent = "N/D"; // Não disponível via esta API simples

    // Nascer e Pôr do Sol (do 'daily')
    elements.sunriseTime.textContent = new Date(daily.sunrise[0]).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    elements.sunsetTime.textContent = new Date(daily.sunset[0]).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Checar e exibir alertas
    checkAndDisplayWeatherAlerts(current, daily);
}

// --- Sistema de Alertas Meteorológicos ---
function checkAndDisplayWeatherAlerts(currentData, dailyData) {
    if (!elements.weatherAlertsBanner || !elements.alertMessage) return;

    const todayMinTemp = dailyData.temperature_2m_min[0];
    const currentWindSpeed = currentData.wind_speed_10m;
    const todayWeatherCode = dailyData.weather_code[0]; // Usar o código do dia para alertas gerais
    // const currentWCode = currentData.weather_code; // Para condições muito imediatas
    const todayPrecipProb = dailyData.precipitation_probability_mean ? dailyData.precipitation_probability_mean[0] : 0; // API de previsão estendida tem isso

    let alertType = null;
    let message = "";

    // Critérios de Alerta (do mais severo para o mais leve)
    // Vermelho (Exemplo: Vento muito forte. Trovoada severa não é facilmente determinada com dados atuais)
    if (currentWindSpeed > 80) {
        alertType = "red";
        message = "Alerta Severo: Ventos extremamente fortes! Busque abrigo e evite áreas abertas.";
    }
    // Laranja (Exemplo: Trovoada, chuva forte, vento forte)
    else if (todayWeatherCode === 95 || todayWeatherCode === 65 || todayWeatherCode === 82 || currentWindSpeed > 60) {
        alertType = "orange";
        if (todayWeatherCode === 95) message = "Risco Moderado: Previsão de trovoada. Possíveis rajadas de vento e chuva forte.";
        else if (todayWeatherCode === 65 || todayWeatherCode === 82) message = "Risco Moderado: Previsão de chuva forte/violenta.";
        else message = "Risco Moderado: Ventos fortes previstos.";
    }
    // Amarelo (Exemplo: Chuva significativa, nevoeiro, vento moderado)
    else if (todayPrecipProb > 70 || todayWeatherCode === 45 || todayWeatherCode === 48 || currentWindSpeed > 40) {
        alertType = "yellow";
        if (todayPrecipProb > 70) message = "Atenção: Alta probabilidade de chuva. Esteja preparado.";
        else if (todayWeatherCode === 45 || todayWeatherCode === 48) message = "Atenção: Nevoeiro previsto. Reduza a velocidade ao dirigir.";
        else message = "Atenção: Ventos moderados a fortes. Cuidado com objetos soltos.";
    }
    // Azul (Frio Intenso)
    else if (todayMinTemp < 5) {
        alertType = "blue";
        message = "Frente fria chegando — proteja-se!";
    }


    if (alertType) {
        elements.alertMessage.textContent = message;
        elements.weatherAlertsBanner.className = 'alerts-card card'; // Reseta classes
        elements.weatherAlertsBanner.classList.add(`alert-${alertType}`);
        elements.weatherAlertsBanner.style.display = 'block';
    } else {
        elements.weatherAlertsBanner.style.display = 'none';
    }
}


function getWindDirectionSymbol(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

function getUvDetails(uvIndex) {
    let text = "";
    let color = "transparent";
    if (uvIndex <= 2) {
        text = "Baixo";
        color = "#77dd77"; // Verde
    } else if (uvIndex <= 5) {
        text = "Moderado";
        color = "#fdfd96"; // Amarelo
    } else if (uvIndex <= 7) {
        text = "Alto";
        color = "#ffb347"; // Laranja
    } else if (uvIndex <= 10) {
        text = "Muito Alto";
        color = "#ff6961"; // Vermelho
    } else {
        text = "Extremo";
        color = "#c8a2c8"; // Violeta
    }
    return { text, color };
}


async function loadAndDisplayWeather() {
    elements.currentLocation.textContent = "Carregando dados...";
    const weatherData = await fetchWeatherData(SAO_PAULO_LAT, SAO_PAULO_LON);
    if (weatherData) {
        updateUI(weatherData);
    } else {
        // A mensagem de erro já foi definida em fetchWeatherData ou updateUI
    }
}

// Lógica para aplicar o tema
function applyTheme() {
    document.body.className = currentSettings.theme;
}

// Navegação entre telas
function setActiveScreen(screenId) {
    elements.screens.forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none'; // Garante que esteja oculto
        if (screen.id === screenId) {
            screen.classList.add('active');
            screen.style.display = 'block'; // Mostra a tela ativa
        }
    });

    document.querySelectorAll('.nav-button').forEach(button => {
        button.classList.remove('active');
    });

    if (screenId === 'home-screen') {
        elements.navHome.classList.add('active');
    } else if (screenId === 'extended-forecast-screen') {
        elements.navForecast.classList.add('active');
        loadAndDisplayExtendedForecast();
    } else if (screenId === 'settings-screen') {
        elements.navSettings.classList.add('active');
        // Futuramente: carregar dados/componentes da tela de configurações
    }
}


// --- Lógica da Previsão Estendida ---

async function fetchExtendedForecastData(latitude, longitude, days) {
    const params = new URLSearchParams({
        latitude: latitude,
        longitude: longitude,
        daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_mean",
        timezone: "America/Sao_Paulo",
        models: currentForecastModel,
        forecast_days: days
    });
    const url = `${API_BASE_URL}?${params.toString()}`;
    console.log("Fetching Extended Forecast URL:", url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro na API (Previsão Estendida): ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Extended Forecast Data Received:", data);
        return data;
    } catch (error) {
        console.error("Erro ao buscar dados da previsão estendida:", error);
        if (elements.forecastContainer) elements.forecastContainer.innerHTML = `<p class="error-message card">Erro ao carregar previsão estendida.</p>`;
        return null;
    }
}

function renderExtendedForecast(data) {
    if (!elements.forecastContainer) return; // Sai se o container não existir (ex: erro no HTML)

    if (!data || !data.daily || !data.daily.time || data.daily.time.length === 0) {
        elements.forecastContainer.innerHTML = `<p class="info-message card">Dados de previsão não disponíveis.</p>`;
        return;
    }

    elements.forecastContainer.innerHTML = ''; // Limpa placeholders ou dados antigos

    const { time, weather_code, temperature_2m_max, temperature_2m_min, precipitation_probability_mean } = data.daily;

    // Define uma faixa de temperatura global para o gradiente da barra (ex: -10°C a 40°C)
    // Isso ajuda a manter a consistência visual da barra entre diferentes dias.
    const GLOBAL_TEMP_MIN_FOR_BAR = -5;
    const GLOBAL_TEMP_MAX_FOR_BAR = 35;
    const TEMP_RANGE_FOR_BAR = GLOBAL_TEMP_MAX_FOR_BAR - GLOBAL_TEMP_MIN_FOR_BAR;

    for (let i = 0; i < time.length; i++) {
        const dayCard = document.createElement('div');
        dayCard.className = 'forecast-day-card card';

        const date = new Date(time[i] + "T00:00:00"); // Adiciona T00:00:00 para evitar problemas de fuso horário na formatação da data
        const dayFormatted = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const weekdayFormatted = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''); // Remove o ponto de "sáb."

        let minTempRaw = temperature_2m_min[i];
        let maxTempRaw = temperature_2m_max[i];
        let minTempDisplay = Math.round(minTempRaw);
        let maxTempDisplay = Math.round(maxTempRaw);
        const tempUnitDisplay = currentSettings.units.temp;

        if (tempUnitDisplay === '°F') {
            minTempDisplay = Math.round((minTempRaw * 9/5) + 32);
            maxTempDisplay = Math.round((maxTempRaw * 9/5) + 32);
        }

        const precipProb = precipitation_probability_mean ? Math.round(precipitation_probability_mean[i]) : 0;

        // Para a barra, usamos sempre a escala Celsius original para consistência do gradiente.
        // As temperaturas exibidas na barra, no entanto, respeitarão a unidade selecionada.
        const minTempPercent = Math.max(0, Math.min(100, ((minTempRaw - GLOBAL_TEMP_MIN_FOR_BAR) / TEMP_RANGE_FOR_BAR) * 100));
        const maxTempPercent = Math.max(0, Math.min(100, ((maxTemp - GLOBAL_TEMP_MIN_FOR_BAR) / TEMP_RANGE_FOR_BAR) * 100));

        const barWidthPercent = Math.abs(maxTempPercent - minTempPercent);
        const barStartOffsetPercent = minTempPercent;

        // Gradiente da barra de temperatura: azul (frio) -> amarelo (médio) -> vermelho (quente)
        // O gradiente é aplicado em toda a extensão da barra (barWidthPercent)
        // As cores podem ser ajustadas para melhor visualização
        const tempBarGradient = `linear-gradient(to right, #65a0f3, #f9d71c, #ff6347)`;

        dayCard.innerHTML = `
            <p class="forecast-date">${weekdayFormatted}, ${dayFormatted}</p>
            <img src="${getWeatherIconPath(weather_code[i])}" alt="${getWeatherDescription(weather_code[i])}" class="forecast-icon">
            <p class="forecast-condition">${getWeatherDescription(weather_code[i])}</p>
            <div class="temp-bar-container" title="Temperatura: ${minTempDisplay}${tempUnitDisplay} - ${maxTempDisplay}${tempUnitDisplay}">
                <div class="temp-bar"
                     style="width: ${barWidthPercent}%;
                            margin-left: ${barStartOffsetPercent}%;
                            background: ${tempBarGradient};">
                    <span class="min-temp">${minTempDisplay}${tempUnitDisplay}</span>
                    <span class="max-temp">${maxTempDisplay}${tempUnitDisplay}</span>
                </div>
            </div>
            <p class="forecast-precipitation">Chuva: ${precipProb}%</p>
        `;
        elements.forecastContainer.appendChild(dayCard);
    }
}

async function loadAndDisplayExtendedForecast() {
    if (!elements.forecastContainer) return;
    elements.forecastContainer.innerHTML = `<div class="forecast-day-card card placeholder"><p>Carregando previsão para ${currentSettings.forecastDays} dias...</p></div>`;
    const forecastData = await fetchExtendedForecastData(SAO_PAULO_LAT, SAO_PAULO_LON, currentSettings.forecastDays);
    if (forecastData) {
        renderExtendedForecast(forecastData);
    }
}

function loadSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('climaWiseSettings'));
    if (savedSettings) {
        currentSettings = { ...currentSettings, ...savedSettings };
    }
    // Aplicar configurações ao iniciar
    elements.forecastDaysSelect.value = currentSettings.forecastDays;
    // O tema é aplicado em initializeTheme
    elements.themeSelect.value = currentSettings.theme;

    // Unidades
    if (currentSettings.units.temp === '°F') elements.tempFahrenheitRadio.checked = true;
    else elements.tempCelsiusRadio.checked = true;

    if (currentSettings.units.pressure === 'mbar') elements.pressureMbarRadio.checked = true;
    else elements.pressureHpaRadio.checked = true;

    if (currentSettings.units.wind === 'mph') elements.windMphRadio.checked = true;
    else elements.windKmhRadio.checked = true;

    // Modelo de execução (visual) - Assume que currentSettings.selectedModelRun existe ou será adicionado
    if(currentSettings.selectedModelRun === '12Z') {
        elements.defaultModelSelect.value = '12Z';
        if(elements.model12zButton) elements.model12zButton.classList.add('active');
        if(elements.model00zButton) elements.model00zButton.classList.remove('active');
    } else { // Padrão para 00Z
        elements.defaultModelSelect.value = '00Z';
        if(elements.model00zButton) elements.model00zButton.classList.add('active');
        if(elements.model12zButton) elements.model12zButton.classList.remove('active');
    }
}

function saveSettings() {
    localStorage.setItem('climaWiseSettings', JSON.stringify(currentSettings));
}

// Função para aplicar mudanças de unidades na UI (chamar após alterar unidades)
function refreshUIDataWithNewUnits() {
    // Se a tela home estiver ativa, recarrega seus dados para refletir unidades
    if (document.getElementById('home-screen').classList.contains('active')) {
        loadAndDisplayWeather(); // Isso já usa currentSettings.units implicitamente ao renderizar
    }
    // Se a tela de previsão estiver ativa, recarrega seus dados
    if (document.getElementById('extended-forecast-screen').classList.contains('active')) {
        loadAndDisplayExtendedForecast(); // Isso também usa currentSettings.units
    }
}


// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();  // Carrega todas as configurações, incluindo o tema, para currentSettings
    applyTheme();    // Aplica o tema com base em currentSettings
    loadAndDisplayWeather();

    // Navegação
    elements.navHome.addEventListener('click', () => setActiveScreen('home-screen'));
    elements.navForecast.addEventListener('click', () => setActiveScreen('extended-forecast-screen'));
    elements.navSettings.addEventListener('click', () => {
        setActiveScreen('settings-screen');
        loadSettings(); // Garante que os campos de config estejam com os valores atuais
    });

    // Atualização automática da home
    const AUTO_REFRESH_INTERVAL = 30 * 60 * 1000;
    setInterval(loadAndDisplayWeather, AUTO_REFRESH_INTERVAL);

    // Refresh manual da home
    if (elements.refreshButton) {
        elements.refreshButton.addEventListener('click', () => {
            console.log("Refresh button (home) clicked");
            loadAndDisplayWeather();
        });
    }

    // --- Event Listeners para Configurações ---
    if (elements.themeSelect) {
        elements.themeSelect.addEventListener('change', (e) => {
            currentSettings.theme = e.target.value;
            applyTheme(); // Aplica a mudança de tema
            saveSettings();
        });
    }

    function setupRadioListeners(radioGroupName, unitType) {
        document.querySelectorAll(`input[name="${radioGroupName}"]`).forEach(radio => {
            radio.addEventListener('change', (e) => {
                currentSettings.units[unitType] = e.target.value;
                saveSettings();
                refreshUIDataWithNewUnits(); // Atualiza a UI com as novas unidades
            });
        });
    }
    setupRadioListeners('temp-unit', 'temp');
    setupRadioListeners('pressure-unit', 'pressure');
    setupRadioListeners('wind-unit', 'wind');


    if (elements.forecastDaysSelect) {
        elements.forecastDaysSelect.addEventListener('change', (e) => {
            currentSettings.forecastDays = parseInt(e.target.value);
            saveSettings();
            // Só recarrega se a tela de previsão estiver ativa
            if (document.getElementById('extended-forecast-screen').classList.contains('active')) {
                loadAndDisplayExtendedForecast();
            }
        });
    }

    if (elements.defaultModelSelect) {
        elements.defaultModelSelect.addEventListener('change', (e) => {
            const selectedRun = e.target.value;
            currentSettings.selectedModelRun = selectedRun; // Salva a preferência
            saveSettings();
            // Atualiza o estado visual dos botões na tela de previsão, se estiverem lá
            if(elements.model00zButton && elements.model12zButton){
                if(selectedRun === '12Z'){
                    elements.model12zButton.classList.add('active');
                    elements.model00zButton.classList.remove('active');
                } else {
                    elements.model00zButton.classList.add('active');
                    elements.model12zButton.classList.remove('active');
                }
            }
            console.log(`Default model run preference set to ${selectedRun} (visual).`);
        });
    }


    const modelButtons = [elements.model00zButton, elements.model12zButton];
    modelButtons.forEach(button => {
        if(button) {
            button.addEventListener('click', (e) => {
                const selectedRun = e.target.dataset.model;
                modelButtons.forEach(btn => { if(btn) btn.classList.remove('active')});
                e.target.classList.add('active');

                // Sincroniza com o select da tela de configurações
                if(elements.defaultModelSelect) elements.defaultModelSelect.value = selectedRun;
                currentSettings.selectedModelRun = selectedRun;
                saveSettings();
                console.log(`Model run ${selectedRun} selected (visual only for OpenMeteo ECMWF IFS).`);
            });
        }
    });

    // Define a tela inicial
    setActiveScreen('home-screen');
});
