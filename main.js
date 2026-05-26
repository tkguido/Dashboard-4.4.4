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
    
    var stackedTimeHTML = '<span class="t-hr">' + hours + '</span><span class="t-colon">:</span><span class="t-min">' + minutes + '</span>';
    document.getElementById('night-time').innerHTML = stackedTimeHTML;
    
    var wkTimeEl = document.getElementById('wk-time');
    if (wkTimeEl) wkTimeEl.innerHTML = stackedTimeHTML;
    
    // Data
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    var dateString = now.toLocaleDateString('pt-BR', options);
    dateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);
    document.getElementById('date').textContent = dateString;
    var wkDateEl = document.getElementById('wk-date');
    if (wkDateEl) wkDateEl.textContent = dateString;

    // --- BARRAS DE PROGRESSO (DIA / MÊS / ANO) ---
    var daySeconds = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
    var dayPct = (daySeconds / 86400) * 100;
    
    var startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    var endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    var monthPct = ((now - startOfMonth) / (endOfMonth - startOfMonth)) * 100;
    
    var startOfYear = new Date(now.getFullYear(), 0, 1);
    var endOfYear = new Date(now.getFullYear() + 1, 0, 1);
    var yearPct = ((now - startOfYear) / (endOfYear - startOfYear)) * 100;
    
    var dayProg = document.getElementById('day-progress');
    if (dayProg) dayProg.style.width = dayPct + '%';
    
    var monthProg = document.getElementById('month-progress');
    if (monthProg) monthProg.style.width = monthPct + '%';
    
    var yearProg = document.getElementById('year-progress');
    if (yearProg) yearProg.style.width = yearPct + '%';

    // --- MÁQUINA DE ESTADOS DO PAINEL ---
    var currentHour = now.getHours();
    var currentDay = now.getDay(); // 0 = Domingo, 6 = Sábado
    
    var isNight = (currentHour >= 19 || currentHour < 7);
    var isWeekend = (currentDay === 0 || currentDay === 6);
    
    // Modo de Teste via URL (?test_weekend=1)
    if (window.location.search.indexOf('test_weekend=1') !== -1) {
        isNight = false; // Desativa o modo noturno para visualizar o fds
        isWeekend = true;
    }
    
    var currentMode = isNight ? 'NIGHT' : (isWeekend ? 'WEEKEND' : 'DAY');
    
    if (currentMode !== previousMode) {
        var nightOverlay = document.getElementById('night-mode-overlay');
        var weekendOverlay = document.getElementById('weekend-mode-overlay');
        var iframe = document.getElementById('yt-iframe');
        var progressContainer = document.getElementById('progress-container');
        
        // 1. Esconde todos
        if (nightOverlay) nightOverlay.className = "hidden";
        if (weekendOverlay) weekendOverlay.className = "hidden";
        if (progressContainer) progressContainer.style.display = "block";
        
        // 2. Aplica o novo estado
        if (currentMode === 'NIGHT') {
            if (nightOverlay) nightOverlay.className = "";
            if (progressContainer) progressContainer.style.display = "none";
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
function ajaxGet(url, onSuccess, onError, expectText) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            if (expectText) {
                onSuccess(xhr.responseText);
            } else {
                try {
                    var data = JSON.parse(xhr.responseText);
                    onSuccess(data);
                } catch (e) {
                    if (onError) onError('JSON Parse Error');
                }
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
    // A cartada final definitiva: wttr.in via HTTPS direto falha no Android 4.4 devido ao certificado Let's Encrypt expirado.
    // E HTTP direto falha por bloqueio de Mixed Content (HTTPS -> HTTP).
    // Solução: Usamos o Proxy Codetabs (que tem SSL do Cloudflare, 100% suportado no Android 4.4) 
    // para envelopar a chamada HTTP do wttr.in!
    var targetUrl = 'http://wttr.in/' + lat + ',' + lon + '?format=%t|%h|%c|%C';
    var url = 'https://api.codetabs.com/v1/proxy/?quest=' + encodeURIComponent(targetUrl);
    
    ajaxGet(url, function(data) {
        if(data) {
            var parts = data.split('|');
            if(parts.length >= 4) {
                var temp = parts[0].replace('+', ''); // Remove the + sign if present
                var humidity = parts[1];
                var icon = parts[2].trim();
                var condition = parts[3].toLowerCase();
                
                // Fundo Dinâmico Sensorial baseado no clima
                document.body.className = ''; // Limpa classes
                if (condition.indexOf('rain') !== -1 || condition.indexOf('drizzle') !== -1 || condition.indexOf('shower') !== -1 || condition.indexOf('thunder') !== -1) {
                    document.body.className = 'bg-rain';
                } else if (condition.indexOf('cloud') !== -1 || condition.indexOf('overcast') !== -1 || condition.indexOf('fog') !== -1 || condition.indexOf('mist') !== -1) {
                    document.body.className = 'bg-cloud';
                } else if (condition.indexOf('sun') !== -1 || condition.indexOf('clear') !== -1) {
                    var h = new Date().getHours();
                    if (h >= 19 || h < 6) {
                        document.body.className = 'bg-clear-night';
                    } else {
                        document.body.className = 'bg-sun';
                    }
                }
                
                document.getElementById('temperature').innerHTML = temp + ' <span style="font-size: 2rem;">' + icon + '</span>';
                document.getElementById('humidity').textContent = humidity;
                
                var wkTempEl = document.getElementById('wk-temp');
                if (wkTempEl) wkTempEl.innerHTML = temp + ' ' + icon;
                var wkHumEl = document.getElementById('wk-hum');
                if (wkHumEl) wkHumEl.textContent = humidity;
                
                document.getElementById('location-status').textContent = 'Dados do clima atualizados';
            }
        }
    }, function(error) {
        console.error('Erro clima wttr via proxy:', error);
        document.getElementById('location-status').textContent = 'Erro ao atualizar clima';
    }, true); // expectText = true
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
// 7. NOTÍCIAS E AGENDA
// ==========================================

// COLE O LINK DA SUA AGENDA (iCal) AQUI:
var calendarUrls = [
    'https://calendar.google.com/calendar/ical/guido%40conjunto.com.br/public/basic.ics',
    'https://calendar.google.com/calendar/ical/conjunto.com.br_gu2qnl2hqlcj77ki53qptckong%40group.calendar.google.com/public/basic.ics'
]; 
var agendaText = '';

function fetchAgenda() {
    if (!calendarUrls || calendarUrls.length === 0) return;
    
    var allEvents = [];
    var requestsCompleted = 0;
    
    function processICal(data) {
        if (data && typeof data === 'string') {
            var lines = data.split('\n');
            var currentEvent = null;
            var now = new Date();
            
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (line === 'BEGIN:VEVENT') {
                    currentEvent = {};
                } else if (line === 'END:VEVENT') {
                    if (currentEvent && currentEvent.start && currentEvent.start > now) {
                        allEvents.push(currentEvent);
                    }
                    currentEvent = null;
                } else if (currentEvent) {
                    if (line.indexOf('DTSTART') === 0) {
                        var parts = line.split(':');
                        if (parts.length > 1) {
                            var dateStr = parts[1];
                            var year = parseInt(dateStr.substring(0, 4));
                            var month = parseInt(dateStr.substring(4, 6)) - 1;
                            var day = parseInt(dateStr.substring(6, 8));
                            var hour = 0, min = 0;
                            if (dateStr.length >= 13) {
                                hour = parseInt(dateStr.substring(9, 11));
                                min = parseInt(dateStr.substring(11, 13));
                            }
                            
                            var isUTC = dateStr.indexOf('Z') !== -1;
                            if (isUTC) {
                                currentEvent.start = new Date(Date.UTC(year, month, day, hour, min));
                            } else {
                                currentEvent.start = new Date(year, month, day, hour, min);
                            }
                        }
                    } else if (line.indexOf('SUMMARY:') === 0) {
                        currentEvent.summary = line.substring(8).replace(/\\,/g, ',');
                    }
                }
            }
        }
        
        requestsCompleted++;
        if (requestsCompleted === calendarUrls.length) {
            finishAgendaLoad();
        }
    }
    
    function finishAgendaLoad() {
        allEvents.sort(function(a, b) { return a.start - b.start; });
        
        if (allEvents.length > 0) {
            var nextEv = allEvents[0];
            var h = nextEv.start.getHours().toString();
            var m = nextEv.start.getMinutes().toString();
            if (h.length < 2) h = '0' + h;
            if (m.length < 2) m = '0' + m;
            
            var now = new Date();
            var isToday = (nextEv.start.getDate() === now.getDate() && nextEv.start.getMonth() === now.getMonth() && nextEv.start.getFullYear() === now.getFullYear());
            var prefix = isToday ? 'Hoje às ' + h + ':' + m : nextEv.start.getDate() + '/' + (nextEv.start.getMonth()+1) + ' às ' + h + ':' + m;
            
            agendaText = nextEv.summary + ' (' + prefix + ')';
            
            // Injeta a agenda dinamicamente nas notícias para evitar Race Condition
            if (typeof newsItems !== 'undefined') {
                var agendaItem = {
                    title: '<span style="color: #c084fc;">🗓️ Próximo Compromisso: ' + agendaText + '</span>',
                    source: 'AGENDA',
                    date: new Date()
                };
                
                // Remove a agenda antiga se existir
                var novaLista = [];
                for(var j = 0; j < newsItems.length; j++) {
                    if (newsItems[j].source !== 'AGENDA') {
                        novaLista.push(newsItems[j]);
                    }
                }
                novaLista.unshift(agendaItem);
                newsItems = novaLista;
                
                // Força a exibição IMEDIATA da agenda assim que ela carrega
                if (typeof displayCurrentNews === 'function') {
                    currentNewsIndex = 0; // Vai pro topo da lista
                    displayCurrentNews(); // Mostra na tela na hora
                }
            }
        } else {
            agendaText = '';
        }
    }

    for (var i = 0; i < calendarUrls.length; i++) {
        var proxyUrl = 'https://api.codetabs.com/v1/proxy/?quest=' + encodeURIComponent(calendarUrls[i]);
        ajaxGet(proxyUrl, processICal, function() { processICal(null); }, true);
    }
}

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
            // A agenda já é inserida dinamicamente no outro método, mas se estiver pronta, injetamos agora
            if (agendaText) {
                tempNews.unshift({
                    title: '<span style="color: #c084fc;">🗓️ Próximo Compromisso: ' + agendaText + '</span>',
                    source: 'AGENDA',
                    date: new Date()
                });
            }
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
fetchAgenda();
fetchNews();

// Atualiza o clima, finanças, agenda e notícias a cada 15 minutos
setInterval(function() {
    fetchFinance();
    if (currentLat && currentLon) fetchWeather(currentLat, currentLon);
    fetchAgenda();
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
    var url = 'https://economia.awesomeapi.com.br/json/last/BTC-USD,ETH-USD,XRP-USD,SOL-USD,USD-BRL,EUR-BRL';
    ajaxGet(url, function(data) {
        // Função auxiliar para injetar valor e cor
        function applyFinance(idPrefix, obj, isCurrency) {
            try {
                if (!obj || !obj.bid) return;
                var varObj = getVariationIndicator(obj.pctChange);
                var valStr = isCurrency ? 'R$ ' + parseFloat(obj.bid).toFixed(2).replace('.', ',') : '$' + parseFloat(obj.bid).toLocaleString('en-US', {maximumFractionDigits: 2});
                
                var priceEl = document.getElementById(idPrefix + '-price');
                if (priceEl) {
                    priceEl.textContent = valStr;
                    priceEl.style.color = varObj.color;
                }
                
                var varEl = document.getElementById(idPrefix + '-var');
                if (varEl) {
                    varEl.innerHTML = '<span style="color:' + varObj.color + '">' + varObj.icon + ' ' + obj.pctChange + '%</span>';
                }
                
                // Binding para o modo fim de semana
                if (idPrefix === 'btc') {
                    var wkBtcEl = document.getElementById('wk-btc-price');
                    if (wkBtcEl) {
                        wkBtcEl.textContent = valStr;
                        wkBtcEl.style.color = varObj.color;
                    }
                }
            } catch (e) {
                console.error('Erro ao aplicar finanças para', idPrefix, e);
            }
        }
        
        applyFinance('btc', data.BTCUSD, false);
        applyFinance('sol', data.SOLUSD, false);
        applyFinance('xrp', data.XRPUSD, false);
        applyFinance('usd', data.USDBRL, true);
        
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

// ==========================================
// 7. BLUETOOTH KEEP-ALIVE (Áudio Fantasma)
// ==========================================
// Cria um áudio inaudível para impedir que caixas de som Bluetooth entrem em suspensão na madrugada
var silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
silentAudio.volume = 0.01;

setInterval(function() {
    var h = new Date().getHours();
    // Toca o áudio fantasma de 5 em 5 minutos durante a noite
    if (h >= 19 || h < 7) {
        silentAudio.play().catch(function(e){});
    }
}, 5 * 60 * 1000);
