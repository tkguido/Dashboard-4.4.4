// Compatibilidade estrita com ES5 para Android 4.4.4
// Sem 'let', 'const', '=>', '`', 'async/await', 'fetch'

// Variável de controle para desligar rádio apenas uma vez na transição
var wasNight = false;

// 1. Relógio, Data e MODO NOTURNO
function updateTime() {
    var now = new Date();
    var hours = now.getHours().toString();
    var minutes = now.getMinutes().toString();
    
    if (hours.length < 2) hours = '0' + hours;
    if (minutes.length < 2) minutes = '0' + minutes;
    
    var timeString = hours + ':' + minutes;
    
    // Atualiza relogio principal e relogio noturno
    document.getElementById('time').textContent = timeString;
    document.getElementById('night-time').textContent = hours + '   ' + minutes; // Sem os dois pontos e com espaço
    
    // Data
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    var dateString = now.toLocaleDateString('pt-BR', options);
    // Capitaliza primeira letra
    dateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);
    document.getElementById('date').textContent = dateString;

    // --- LÓGICA DO MODO NOTURNO (RELOGIO PRO) ---
    var currentHour = now.getHours();
    var nightModeOverlay = document.getElementById('night-mode-overlay');
    var isNight = (currentHour >= 19 || currentHour < 7);

    if (isNight) {
        nightModeOverlay.className = ""; // Remove 'hidden'
        if (!wasNight) {
            // Desliga a rádio/vídeo ao entrar no modo noturno
            var iframe = document.getElementById('yt-iframe');
            if (iframe) iframe.src = '';
            wasNight = true;
        }
    } else {
        nightModeOverlay.className = "hidden"; // Adiciona 'hidden'
        wasNight = false;
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
    // Usando HTTP puro em vez de HTTPS para evitar erros de SSL no Android 4.4
    var url = 'http://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto';
    
    ajaxGet(url, function(data) {
        // Clima Atual
        var temp = data.current.temperature_2m;
        var humidity = data.current.relative_humidity_2m;
        var code = data.current.weather_code;
        
        document.getElementById('temperature').innerHTML = Math.round(temp) + '°C <span style="font-size: 2rem;">' + getWeatherIcon(code) + '</span>';
        document.getElementById('humidity').textContent = humidity + '%';
        
        document.getElementById('location-status').textContent = 'Dados do clima atualizados';
    }, function(error) {
        console.error('Erro clima:', error);
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
                console.warn('Geoloc bloqueada, usando POA.', error);
                document.getElementById('location-status').textContent = 'Local padrão: Porto Alegre';
                fetchWeather(currentLat, currentLon);
            }
        );
    } else {
        document.getElementById('location-status').textContent = 'Geolocalização não suportada';
        fetchWeather(currentLat, currentLon);
    }
}
function updateWeather() { fetchWeather(currentLat, currentLon); }
initWeather();
setInterval(updateWeather, 30 * 60 * 1000);

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
    // Troca o src pelo novo vídeo ou playlist (Autoplay=0 para evitar tela preta)
    if (val.indexOf('list=') !== -1) {
        finalUrl = 'https://www.youtube.com/embed/videoseries?' + val + '&autoplay=0&controls=1';
    } else {
        finalUrl = 'https://www.youtube.com/embed/' + val + '?autoplay=0&controls=1';
    }
    
    setYouTubeIframe(finalUrl);
    
    // Limpa o input de texto
    document.getElementById('yt-link').value = '';
}

function loadCustomYouTube() {
    var input = document.getElementById('yt-link').value;
    
    // Se clicou no botão Tocar mas não colou nenhum link, carrega o que estiver no Dropdown
    if (!input || input.trim() === '') {
        loadPresetYouTube();
        return;
    }
    
    var finalUrl = '';
    
    // Testa se é link de Playlist
    if (input.indexOf('list=') !== -1) {
        var listId = input.split('list=')[1].split('&')[0];
        finalUrl = 'https://www.youtube.com/embed/videoseries?list=' + listId + '&autoplay=0&controls=1';
    } 
    // Testa se é link normal (watch?v=)
    else if (input.indexOf('watch?v=') !== -1) {
        var videoId = input.split('watch?v=')[1].split('&')[0];
        finalUrl = 'https://www.youtube.com/embed/' + videoId + '?autoplay=0&controls=1';
    } 
    // Testa se é link encurtado (youtu.be/)
    else if (input.indexOf('youtu.be/') !== -1) {
        var videoId = input.split('youtu.be/')[1].split('?')[0];
        finalUrl = 'https://www.youtube.com/embed/' + videoId + '?autoplay=0&controls=1';
    } 
    // Se digitou apenas o ID direto
    else if (input.length === 11) {
        finalUrl = 'https://www.youtube.com/embed/' + input + '?autoplay=0&controls=1';
    } else {
        alert("Link inválido. Cole o link completo do YouTube.");
        return;
    }
    
    setYouTubeIframe(finalUrl);
}
