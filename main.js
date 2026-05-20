// Compatibilidade estrita com ES5 para Android 4.4.4
// Sem 'let', 'const', '=>', '`', 'async/await', 'fetch'

// Variável de controle de estado: 'START', 'DAY', 'NIGHT', 'WEEKEND'
var previousMode = 'START';

// 1. Relógio, Data e MODO NOTURNO/FIM DE SEMANA
function updateTime() {
    var now = new Date();
    var hours = now.getHours().toString();
    var minutes = now.getMinutes().toString();
    
    if (hours.length < 2) hours = '0' + hours;
    if (minutes.length < 2) minutes = '0' + minutes;
    
    var timeString = hours + ':' + minutes;
    
    // Atualiza relogio principal, noturno e fim de semana
    document.getElementById('time').textContent = timeString;
    document.getElementById('night-time').textContent = hours + '   ' + minutes;
    var wkTimeEl = document.getElementById('wk-time');
    if (wkTimeEl) wkTimeEl.textContent = timeString;
    
    // Data
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    var dateString = now.toLocaleDateString('pt-BR', options);
    dateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);
    document.getElementById('date').textContent = dateString;
    var wkDateEl = document.getElementById('wk-date');
    if (wkDateEl) wkDateEl.textContent = dateString;

    // --- MÁQUINA DE ESTADOS DO PAINEL ---
    var currentHour = now.getHours();
    var currentDay = now.getDay(); // 0 = Domingo, 6 = Sábado
    
    var isNight = (currentHour >= 19 || currentHour < 7);
    var isWeekend = (currentDay === 0 || currentDay === 6);
    
    var currentMode = isNight ? 'NIGHT' : (isWeekend ? 'WEEKEND' : 'DAY');
    
    if (currentMode !== previousMode) {
        var nightOverlay = document.getElementById('night-mode-overlay');
        var weekendOverlay = document.getElementById('weekend-mode-overlay');
        var iframe = document.getElementById('yt-iframe');
        
        // 1. Esconde todos
        if (nightOverlay) nightOverlay.className = "hidden";
        if (weekendOverlay) weekendOverlay.className = "hidden";
        
        // 2. Aplica o novo estado
        if (currentMode === 'NIGHT') {
            if (nightOverlay) nightOverlay.className = "";
            if (iframe) iframe.src = ''; // Desliga som
        } else if (currentMode === 'WEEKEND') {
            if (weekendOverlay) weekendOverlay.className = "";
            if (iframe) iframe.src = ''; // Desliga som
        } else if (currentMode === 'DAY') {
            // Volta para a rádio normal
            if (typeof loadPresetYouTube === 'function') {
                loadPresetYouTube();
            }
        }
        
        previousMode = currentMode;
    }

    // --- EFEITO COMEMORATIVO (HORA REDONDA) ---
    var currentSeconds = now.getSeconds();
    var celebOverlay = document.getElementById('celebration-overlay');
    
    // Dispara apenas quando for exatamente 00 minutos e 00 segundos, e não estiver no modo noturno
    if (minutes === '00' && currentSeconds === 0 && !isNight) {
        celebOverlay.className = "active";
        
        // Remove a classe após 10 segundos
        setTimeout(function() {
            celebOverlay.className = "hidden";
        }, 10000);
    }
}
setInterval(updateTime, 1000);
updateTime();

// Utilitário Ajax (Substituto do Fetch)
function ajaxGet(url, onSuccess, onError) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                var data = JSON.parse(xhr.responseText);
                onSuccess(data);
            } catch (e) {
                if (onError) onError('JSON Parse Error');
            }
        } else {
            if (onError) onError('Status ' + xhr.status);
        }
    };
    xhr.onerror = function() {
        if (onError) onError('Network Error');
    };
    xhr.send();
}

// 2. Clima e Prognóstico (Open-Meteo)
function getWeatherIcon(code) {
    if (code === 0) return '☀️'; // Céu limpo
    if (code >= 1 && code <= 3) return '🌤️'; // Parcialmente nublado
    if (code >= 45 && code <= 48) return '🌫️'; // Nevoeiro
    if (code >= 51 && code <= 67) return '🌧️'; // Chuva
    if (code >= 71 && code <= 77) return '❄️'; // Neve
    if (code >= 80 && code <= 82) return '🌦️'; // Pancadas de chuva
    if (code >= 95 && code <= 99) return '⛈️'; // Tempestade
    return '☁️'; // Padrão
}

var currentLat = -30.0346; // Padrão Porto Alegre
var currentLon = -51.2177;

function fetchWeather(lat, lon) {
    // A cartada final: O Open-Meteo tem Let's Encrypt (bloqueado no Android 4.4)
    // Então embrulhamos a requisição em um Proxy Público que roda em Cloudflare (Liberado no Android 4.4!)
    var baseWeatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto';
    var url = 'https://api.codetabs.com/v1/proxy/?quest=' + encodeURIComponent(baseWeatherUrl);
    
    ajaxGet(url, function(data) {
        if(data && data.current) {
            var temp = data.current.temperature_2m;
            var humidity = data.current.relative_humidity_2m;
            var code = data.current.weather_code;
            
            // Fundo Dinâmico Sensorial baseado no clima
            document.body.className = ''; // Limpa classes
            if (code === 0) document.body.className = 'bg-sun';
            else if (code >= 1 && code <= 48) document.body.className = 'bg-cloud';
            else if (code >= 51 && code <= 99) document.body.className = 'bg-rain';
            
            document.getElementById('temperature').innerHTML = Math.round(temp) + '°C <span style="font-size: 2rem;">' + getWeatherIcon(code) + '</span>';
            document.getElementById('humidity').textContent = humidity + '%';
            
            var wkTempEl = document.getElementById('wk-temp');
            if (wkTempEl) wkTempEl.innerHTML = Math.round(temp) + '°C ' + getWeatherIcon(code);
            var wkHumEl = document.getElementById('wk-hum');
            if (wkHumEl) wkHumEl.textContent = humidity + '%';
            
            document.getElementById('location-status').textContent = 'Dados do clima atualizados';
        }
    }, function(error) {
        console.error('Erro clima Proxy:', error);
        document.getElementById('location-status').textContent = 'Erro ao atualizar clima';
    });
}

function initWeather() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                currentLat = position.coords.latitude;
                currentLon = position.coords.longitude;
                fetchWeather(currentLat, currentLon);
            },
            function(error) {
                console.warn('Geoloc bloqueada ou timeout, usando POA.', error);
                document.getElementById('location-status').textContent = 'Local padrão: Porto Alegre';
                fetchWeather(currentLat, currentLon);
            },
            { timeout: 5000, maximumAge: 60000 } // Obriga a falhar em 5s se travar
        );
    } else {
        document.getElementById('location-status').textContent = 'Geolocalização não suportada';
        fetchWeather(currentLat, currentLon);
    }
}

// ==========================================
// 7. NOTÍCIAS (G1 & CNN)
// ==========================================
var newsItems = [];
var currentNewsIndex = 0;
var newsInterval = null;

function fetchNews() {
    var statusEl = document.getElementById('news-status');
    if(statusEl) statusEl.textContent = 'Atualizando...';
    
    var g1Url = 'https://api.codetabs.com/v1/proxy/?quest=https://api.rss2json.com/v1/api.json?rss_url=https://g1.globo.com/rss/g1/';
    var cnnUrl = 'https://api.codetabs.com/v1/proxy/?quest=https://api.rss2json.com/v1/api.json?rss_url=https://www.cnnbrasil.com.br/feed/';
    
    var tempNews = [];
    var requestsCompleted = 0;
    
    function processResponse(data, sourceName) {
        if (data && data.items) {
            for (var i = 0; i < Math.min(data.items.length, 10); i++) {
                var item = data.items[i];
                var pubDate = item.pubDate ? new Date(item.pubDate.replace(/-/g, '/')) : new Date();
                tempNews.push({
                    title: item.title,
                    source: sourceName,
                    date: pubDate
                });
            }
        }
        requestsCompleted++;
        if (requestsCompleted === 2) {
            finishNewsLoad(tempNews);
        }
    }
    
    ajaxGet(g1Url, function(data) { processResponse(data, 'G1'); }, function() { processResponse(null, 'G1'); });
    ajaxGet(cnnUrl, function(data) { processResponse(data, 'CNN'); }, function() { processResponse(null, 'CNN'); });
}

function finishNewsLoad(articles) {
    var statusEl = document.getElementById('news-status');
    var tickerEl = document.getElementById('news-ticker');
    
    if (articles.length === 0) {
        if(statusEl) statusEl.textContent = 'Erro';
        if(tickerEl) tickerEl.innerHTML = 'Não foi possível carregar as notícias no momento.';
        return;
    }
    
    // Ordenar por data mais recente
    articles.sort(function(a, b) {
        return b.date - a.date;
    });
    
    newsItems = articles;
    currentNewsIndex = 0;
    if(statusEl) statusEl.textContent = 'Atualizado';
    
    displayCurrentNews();
    
    if (newsInterval) clearInterval(newsInterval);
    newsInterval = setInterval(displayCurrentNews, 8000); // Troca manchete a cada 8s
}

function displayCurrentNews() {
    if (newsItems.length === 0) return;
    
    var tickerEl = document.getElementById('news-ticker');
    if (!tickerEl) return;
    
    var item = newsItems[currentNewsIndex];
    
    // Style do Badge
    var badgeColor = item.source === 'G1' ? '#c8102e' : '#cc0000'; 
    var badgeStyle = 'background:' + badgeColor + '; color:#fff; padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; margin-right:8px; vertical-align:middle;';
    
    tickerEl.innerHTML = '<span style="' + badgeStyle + '">' + item.source + '</span> ' + item.title;
    
    currentNewsIndex++;
    if (currentNewsIndex >= newsItems.length) currentNewsIndex = 0;
}

// Inicialização Geral
setInterval(updateTime, 1000);
updateTime();
fetchFinance();
initWeather();
fetchNews();

// Atualiza o clima, finanças e notícias a cada 15 minutos
setInterval(function() {
    fetchFinance();
    if (currentLat && currentLon) fetchWeather(currentLat, currentLon);
    fetchNews();
}, 15 * 60 * 1000);

// 3. Finanças (AwesomeAPI)
function getVariationIndicator(pctChange) {
    var val = parseFloat(pctChange);
    if (val > 0) return { icon: '↗', color: '#4ade80' }; // Verde
    if (val < 0) return { icon: '↘', color: '#f87171' }; // Vermelho
    return { icon: '→', color: '#94a3b8' }; // Cinza
}

function fetchFinance() {
    var url = 'https://economia.awesomeapi.com.br/json/last/BTC-USD,ETH-USD,USD-BRL,EUR-BRL';
    ajaxGet(url, function(data) {
        // Função auxiliar para injetar valor e cor
        function applyFinance(idPrefix, obj, isCurrency) {
            var varObj = getVariationIndicator(obj.pctChange);
            var valStr = isCurrency ? 'R$ ' + parseFloat(obj.bid).toFixed(2).replace('.', ',') : '$' + parseFloat(obj.bid).toLocaleString('en-US', {maximumFractionDigits: 0});
            
            var priceEl = document.getElementById(idPrefix + '-price');
            priceEl.textContent = valStr;
            priceEl.style.color = varObj.color; // Pinta o valor de verde/vermelho
            
            document.getElementById(idPrefix + '-var').innerHTML = '<span style="color:' + varObj.color + '">' + varObj.icon + ' ' + obj.pctChange + '%</span>';
            
            // Binding para o modo fim de semana
            if (idPrefix === 'btc') {
                var wkBtcEl = document.getElementById('wk-btc-price');
                if (wkBtcEl) {
                    wkBtcEl.textContent = valStr;
                    wkBtcEl.style.color = varObj.color;
                }
            }
        }
        
        applyFinance('btc', data.BTCUSD, false);
        applyFinance('eth', data.ETHUSD, false);
        applyFinance('usd', data.USDBRL, true);
        applyFinance('eur', data.EURBRL, true);
        
        var now = new Date();
        var h = now.getHours();
        var m = now.getMinutes();
        if(h < 10) h = '0'+h;
        if(m < 10) m = '0'+m;
        document.getElementById('finance-status').textContent = 'Atualizado às ' + h + ':' + m;
    }, function(error) {
        console.error('Erro finance:', error);
        document.getElementById('finance-status').textContent = 'Erro ao atualizar cotações';
    });
}
fetchFinance();
setInterval(fetchFinance, 5 * 60 * 1000);

// 4. Calendário (3 meses) ES5
function generateCalendar(year, month) {
    var monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var firstDayIndex = new Date(year, month, 1).getDay();
    
    var html = '<div class="month-container">';
    html += '<h4 class="month-name">' + monthNames[month] + ' De ' + year + '</h4>';
    html += '<div class="days-grid">';
    
    // Cabeçalho dos dias
    var weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    html += '<div class="days-header">';
    for (var i = 0; i < weekDays.length; i++) {
        html += '<div class="day-cell header">' + weekDays[i] + '</div>';
    }
    html += '</div>'; // close days-header
    
    var today = new Date();
    var isCurrentMonth = (today.getMonth() === month && today.getFullYear() === year);
    var currentDay = today.getDate();
    
    var dayCounter = 1;
    var maxRows = 6;
    
    for (var row = 0; row < maxRows; row++) {
        html += '<div class="days-row">';
        for (var col = 0; col < 7; col++) {
            if (row === 0 && col < firstDayIndex) {
                html += '<div class="day-cell empty"></div>';
            } else if (dayCounter > daysInMonth) {
                html += '<div class="day-cell empty"></div>';
            } else {
                var isToday = (isCurrentMonth && dayCounter === currentDay);
                if (isToday) {
                    html += '<div class="day-cell"><span class="today-marker">' + dayCounter + '</span></div>';
                } else {
                    html += '<div class="day-cell">' + dayCounter + '</div>';
                }
                dayCounter++;
            }
        }
        html += '</div>'; // close days-row
        if (dayCounter > daysInMonth) break;
    }
    
    html += '</div></div>'; // close days-grid and month-container
    return html;
}

function renderCalendars() {
    var container = document.getElementById('calendars-container');
    var today = new Date();
    var currentMonth = today.getMonth();
    var currentYear = today.getFullYear();
    
    var html = "";
    // Mês atual
    html += generateCalendar(currentYear, currentMonth);
    
    container.innerHTML = html;
}
renderCalendars();

// ==========================================
// 5. MODO FULLSCREEN E WAKE LOCK
// ==========================================
var noSleepVideo = document.createElement('video');
noSleepVideo.setAttribute('loop', '');
noSleepVideo.setAttribute('muted', '');
noSleepVideo.setAttribute('playsinline', '');
noSleepVideo.style.display = 'none';
noSleepVideo.src = 'data:video/webm;base64,GkXfo0AgQoaBAUL3gQFC8oEEQvOBCEKCQAR3ZWJtQoeBAkKFgQIYU4BnQg0OQM1ZQ0Mvw6AQAwTz4QAHBwEAAQAAQQIDQQoT2IQA1xAAXEMEDwABAAABBQgOEI0GAYkGQQQSAQEAAAEHCA4QjQYBkgZBBBABAgAAABmRAo4QEAABAAAAAQgOEI0GAYkGQQQSAQEAAAEHCA4QjQYBkgZBBBABAgAAABqXAEjDAwAAZ0IANwAAB3YAAAEAAHAAABGSEAkXEQIDQQoT2IQA1xAAXEMEDwABAAABBQgOEI0GAYkGQQQSAQEAAAEHCA4QjQYBkgZBBBABAgAAABmRAo4QEAABAAAAAQgOEI0GAYkGQQQSAQEAAAEHCA4QjQYBkgZBBBABAgAAABqXAEjDAwAAZ0IANwAAB3YAAAEAAHAAABGSEAkXEBwO';
document.body.appendChild(noSleepVideo);

document.querySelector('.clock-card').addEventListener('click', function() {
    // 1. Tela Cheia (Esconde a barra)
    var elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Android antigo e Chrome */
        elem.webkitRequestFullscreen();
    }
    
    // 2. Previne o desligamento da tela rodando um micro video vazio em loop
    noSleepVideo.play().catch(function(){});
    
    // 3. Testa a pirotecnia (Edge Lighting) ao clicar no relógio
    var celebOverlay = document.getElementById('celebration-overlay');
    celebOverlay.className = "active";
    setTimeout(function() {
        celebOverlay.className = "hidden";
    }, 4000); // Fica aceso por 4 segundos
});

// ==========================================
// 6. YOUTUBE HUB (LÓGICA DE PLAYLIST)
// ==========================================
function setYouTubeIframe(url) {
    var container = document.querySelector('.iframe-container');
    container.innerHTML = '<iframe id="yt-iframe" width="100%" height="100%" src="' + url + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius: 12px;"></iframe>';
}

function loadPresetYouTube() {
    var select = document.getElementById('yt-preset');
    var val = select.value;
    
    var finalUrl = '';
    // Troca o src pelo novo vídeo ou playlist (Autoplay=1 para iniciar na hora)
    if (val.indexOf('list=') !== -1) {
        finalUrl = 'https://www.youtube.com/embed/videoseries?' + val + '&autoplay=1&controls=1';
    } else {
        finalUrl = 'https://www.youtube.com/embed/' + val + '?autoplay=1&controls=1';
    }
    
    setYouTubeIframe(finalUrl);
}
