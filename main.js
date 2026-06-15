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

/* =========================================
   TRADE ALERTS (NTFY.SH)
   ========================================= */
var alertTimeout = null;

function pollTradeAlerts() {
    // INVIÁVEL: ntfy.sh exige Let's Encrypt, e Android 4.4 ignora o certificado instalado para conexões em segundo plano (XHR).
    // Como os proxies gratuitos acabaram, não há como ler do ntfy.sh neste tablet.
    console.log("Trade alerts desabilitados devido a incompatibilidade SSL do Android 4.4 com ntfy.sh.");
}

function initTradeAlerts() {
    // Poll logo ao iniciar
    pollTradeAlerts();
    // Poll a cada 10 segundos
    setInterval(pollTradeAlerts, 10000);
}

function showTradeAlert(title, message) {
    var overlay = document.getElementById('trade-alert-overlay');
    var titleEl = document.getElementById('trade-alert-title');
    var msgEl = document.getElementById('trade-alert-msg');
    var audioEl = document.getElementById('trade-alert-sound');
    
    if (!overlay) return;
    
    titleEl.textContent = title;
    msgEl.textContent = message;
    
    // Determina a cor com base no título
    overlay.className = ''; // limpa
    if (title.toUpperCase().indexOf('COMPRA') !== -1 || title.toUpperCase().indexOf('BUY') !== -1) {
        overlay.classList.add('buy-alert');
    } else if (title.toUpperCase().indexOf('VENDA') !== -1 || title.toUpperCase().indexOf('SELL') !== -1) {
        overlay.classList.add('sell-alert');
    }
    
    overlay.classList.add('show-alert');
    
    // Tocar som
    if (audioEl) {
        audioEl.currentTime = 0;
        var playPromise = audioEl.play();
        if (playPromise !== undefined) {
            playPromise.catch(function(error) {
                console.log("Audio autoplay prevented", error);
            });
        }
    }
    
    if (alertTimeout) {
        clearTimeout(alertTimeout);
    }
    
    alertTimeout = setTimeout(function() {
        overlay.classList.remove('show-alert');
    }, 15000); // 15 segundos na tela
}

function getWeatherIcon(slug) {
    var icons = {
        'clear_day': '☀️',
        'clear_night': '🌙',
        'cloud': '☁️',
        'cloudly_day': '🌤️',
        'cloudly_night': '🌥️',
        'rain': '🌧️',
        'storm': '⛈️',
        'snow': '❄️',
        'hail': '🌧️',
        'fog': '🌫️'
    };
    return icons[slug] || '☁️';
}

function fetchWeather(lat, lon) {
    // Coordenadas default para Porto Alegre se a geolocalização falhar
    var latitude = lat || -30.0346;
    var longitude = lon || -51.2177;
    
    // Open-Meteo não precisa de chave, tem suporte a CORS e HTTPS para Android 4.4
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + latitude + '&longitude=' + longitude + '&current_weather=true';
    
    ajaxGet(url, function(data) {
        if(data && data.current_weather) {
            var current = data.current_weather;
            var temp = Math.round(current.temperature);
            var code = current.weathercode;
            var isDay = current.is_day === 1;
            
            var locStatusEl = document.getElementById('location-status');
            var weatherIconEl = document.getElementById('weather-icon');
            
            // Format: Apenas a temperatura atual
            var tempStr = temp + '&deg;';
            if (locStatusEl) locStatusEl.innerHTML = ''; // Limpa subtitulo, a não ser que a gente queira outra coisa aqui
            
            // Map WMO code to description and icons
            var desc = 'Nublado';
            var iconClass = 'fas fa-cloud';
            var iconColor = '#94a3b8';
            var bgClass = 'bg-cloud';
            
            if (code === 0 || code === 1) {
                desc = 'Céu Limpo';
                if (isDay) {
                    iconClass = 'fas fa-sun';
                    iconColor = '#FDB813';
                    bgClass = 'bg-sun';
                } else {
                    iconClass = 'fas fa-moon';
                    iconColor = '#cbd5e1';
                    bgClass = 'bg-clear-night';
                }
            } else if (code === 2 || code === 3 || code === 45 || code === 48) {
                desc = code === 45 || code === 48 ? 'Nevoeiro' : 'Nublado';
                iconClass = 'fas fa-cloud';
                iconColor = '#94a3b8';
                bgClass = 'bg-cloud';
            } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
                desc = 'Chuva';
                iconClass = 'fas fa-cloud-rain';
                iconColor = '#60a5fa';
                bgClass = 'bg-rain';
            } else if (code >= 95) {
                desc = 'Tempestade';
                iconClass = 'fas fa-bolt';
                iconColor = '#fbbf24';
                bgClass = 'bg-rain';
            } else if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
                desc = 'Neve';
                iconClass = 'fas fa-snowflake';
                iconColor = '#e2e8f0';
                bgClass = 'bg-cloud';
            }
            
            document.body.className = bgClass;
            
            if (weatherIconEl) {
                weatherIconEl.className = iconClass;
                weatherIconEl.style.color = iconColor;
            }
            
            var iconHtml = '<i class="' + iconClass + '" style="color:' + iconColor + '"></i>';
            
            var tempEl = document.getElementById('temperature');
            if(tempEl) tempEl.innerHTML = tempStr;
            
            var humEl = document.getElementById('humidity');
            if(humEl) humEl.textContent = desc;
            
            var wkTempEl = document.getElementById('wk-temp');
            if(wkTempEl) wkTempEl.innerHTML = tempStr + ' ' + iconHtml;
            
            var wkHumEl = document.getElementById('wk-hum');
            if(wkHumEl) wkHumEl.textContent = desc;
        }
    }, function(err) {
        var locStatusEl = document.getElementById('location-status');
        if (locStatusEl) locStatusEl.textContent = 'Erro Clima';
    }, false);
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
        var proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(calendarUrls[i]);
        ajaxGet(proxyUrl, processICal, function() { processICal(null); }, true);
    }
}

var newsItems = [];
var currentNewsIndex = 0;
var newsInterval = null;
var previousScores = {};

function triggerGoalAnimation(customText) {
    var overlay = document.getElementById('goal-overlay');
    var ball = document.getElementById('goal-ball');
    var textEl = document.getElementById('goal-text');
    if (!overlay || !ball) return;
    
    overlay.classList.remove('hidden');
    
    // Reseta estado inicial
    ball.style.webkitTransition = 'none';
    ball.style.transition = 'none';
    ball.style.opacity = '0';
    ball.style.webkitTransform = 'scale(0.01) rotate(0deg)';
    ball.style.transform = 'scale(0.01) rotate(0deg)';
    overlay.style.webkitTransition = 'none';
    overlay.style.transition = 'none';
    overlay.style.background = 'rgba(0,0,0,0)';
    
    if (textEl) {
        textEl.style.opacity = '0';
        textEl.style.webkitTransform = 'scale(0.5)';
        textEl.style.transform = 'scale(0.5)';
        textEl.innerHTML = customText || 'GOL!';
    }
    
    // Força reflow
    void overlay.offsetWidth;
    
    // Ativa as transições
    ball.style.webkitTransition = '-webkit-transform 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.5s ease-in';
    ball.style.transition = 'transform 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.5s ease-in';
    overlay.style.webkitTransition = 'background 0.5s ease';
    overlay.style.transition = 'background 0.5s ease';
    
    // Inicia a animação da bola
    overlay.style.background = 'rgba(0,0,0,0.8)';
    ball.style.opacity = '1';
    ball.style.webkitTransform = 'scale(25) rotate(1080deg)';
    ball.style.transform = 'scale(25) rotate(1080deg)';
    
    // Inicia a animação do texto depois que a bola cresceu um pouco
    if (textEl) {
        setTimeout(function() {
            textEl.style.opacity = '1';
            textEl.style.webkitTransform = 'scale(1)';
            textEl.style.transform = 'scale(1)';
        }, 1000);
    }
    
    setTimeout(function() {
        // Desaparece
        ball.style.webkitTransition = 'opacity 0.5s ease, -webkit-transform 0.5s ease';
        ball.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        ball.style.opacity = '0';
        ball.style.webkitTransform = 'scale(26) rotate(1080deg)';
        ball.style.transform = 'scale(26) rotate(1080deg)';
        overlay.style.background = 'rgba(0,0,0,0)';
        
        if (textEl) {
            textEl.style.opacity = '0';
            textEl.style.webkitTransform = 'scale(1.2)';
            textEl.style.transform = 'scale(1.2)';
        }
        
        setTimeout(function() {
            overlay.classList.add('hidden');
        }, 500);
    }, 6000); // aumentei o tempo de exibição para 6 segundos
}

function fetchNews() {
    var statusEl = document.getElementById('news-status');
    if(statusEl) statusEl.textContent = 'Atualizando...';
    
    // URL dos jogos da Copa do Mundo (ESPN Scoreboard API) - Funciona com CORS nativo
    var cnnUrl = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
    
    var tempNews = [];
    var requestsCompleted = 0;
    
    function processResponse(data, sourceName) {
        if (data && data.events && data.events.length > 0) {
            for (var i = 0; i < data.events.length; i++) {
                var event = data.events[i];
                if (event.competitions && event.competitions.length > 0) {
                    var comp = event.competitions[0];
                    if (comp.competitors && comp.competitors.length >= 2) {
                        var home = comp.competitors[0];
                        var away = comp.competitors[1];
                        
                        var team1 = home.team.displayName || home.team.abbreviation;
                        var score1 = home.score || "0";
                        var team2 = away.team.displayName || away.team.abbreviation;
                        var score2 = away.score || "0";
                        
                        var status = comp.status ? comp.status.type.shortDetail : "";
                        var state = comp.status ? comp.status.type.state : "";
                        
                        var timeLabel = "";
                        var isLive = false;
                        if (state === "pre" || status === "Scheduled") {
                            var eventDate = new Date(event.date);
                            timeLabel = eventDate.getHours() + "h";
                        } else if (state === "post" || status === "Final" || status === "FT") {
                            timeLabel = "FIM";
                        } else if (status === "Half") {
                            timeLabel = "INT";
                            isLive = true;
                        } else {
                            var clock = comp.status && comp.status.displayClock ? comp.status.displayClock : "";
                            timeLabel = clock ? clock : "AO VIVO";
                            isLive = true;
                        }
                        
                        var matchKey = team1 + "-" + team2;
                        var s1 = parseInt(score1, 10) || 0;
                        var s2 = parseInt(score2, 10) || 0;
                        
                        if (previousScores[matchKey]) {
                            var oldS1 = previousScores[matchKey].home;
                            var oldS2 = previousScores[matchKey].away;
                            
                            // Aumentou o placar de algum time? GOL!
                            if (s1 > oldS1 || s2 > oldS2) {
                                triggerGoalAnimation('GOOOL!<br><br><span style="font-size: 0.6em; line-height: 1.2; display: block; text-transform: uppercase; font-weight: 900;">' + team1 + '<br><span style="font-size: 1.5em; font-weight: 900; color: #fff;">' + s1 + 'x' + s2 + '</span><br>' + team2 + '</span>');
                            }
                        }
                        previousScores[matchKey] = { home: s1, away: s2 };
                        
                        var liveIndicator = isLive ? '<span class="live-dot">●</span>' : '';
                        var timeColor = isLive ? '#22c55e' : '#38bdf8'; // Verde se live, azul claro senão
                        
                        var text = '<span style="color: ' + timeColor + '; font-weight: bold; min-width: 45px; display: inline-block;">' + liveIndicator + timeLabel + '</span> | ' + team1 + " " + score1 + " x " + score2 + " " + team2;
                        
                        tempNews.push({
                            title: text,
                            source: 'COPA',
                            date: new Date(event.date)
                        });
                    }
                }
            }
        }
        requestsCompleted++;
        if (requestsCompleted === 1) { // Só temos 1 feed agora
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
    
    ajaxGet(cnnUrl, function(data) { processResponse(data, 'Copa do Mundo'); }, function() { processResponse(null, 'Copa do Mundo'); });
}

function finishNewsLoad(articles) {
    var statusEl = document.getElementById('news-status');
    var tickerEl = document.getElementById('news-ticker');
    
    if (articles.length === 0) {
        if(statusEl) statusEl.textContent = 'Erro';
        if(tickerEl) tickerEl.innerHTML = '<div style="margin-bottom: 2px;"><span style="background:#005a1d; color:#fff; padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; margin-right:8px; vertical-align:middle; display:inline-block; margin-bottom:4px;">COPA</span></div><div style="font-size: 1.1rem; line-height: 1.3; color: #e2e8f0; white-space: normal;">Nenhum jogo da Copa programado para hoje.</div>';
        return;
    }
    
    if(statusEl) statusEl.textContent = 'Atualizado';
    
    if(newsInterval) {
        clearInterval(newsInterval);
        newsInterval = null;
    }
    
    tickerEl.style.opacity = 0;
    setTimeout(function() {
        var html = '<div style="margin-bottom: 8px;"><span style="background:#005a1d; color:#fff; padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; margin-right:8px; vertical-align:middle; display:inline-block;">COPA DO MUNDO</span><span style="font-size:0.9rem; color:#94a3b8; vertical-align:middle;">JOGOS DE HOJE</span></div>';
        html += '<div style="display:flex; flex-direction:column; justify-content:center; gap:6px; font-size:1.05rem;">';
        for (var i = 0; i < articles.length; i++) {
            html += '<div style="white-space: normal; color: #e2e8f0; margin-bottom: 2px;">' + articles[i].title + '</div>';
        }
        html += '</div>';
        tickerEl.innerHTML = html;
        tickerEl.style.opacity = 1;
    }, 500);
}

function displayCurrentNews() {
    if (newsItems.length === 0) return;
    
    var tickerEl = document.getElementById('news-ticker');
    if (!tickerEl) return;
    
    var item = newsItems[currentNewsIndex];
    
    // Style do Badge
    var badgeColor = '#005a1d'; // Verde Copa
    if (item.source === 'AGENDA') badgeColor = '#c084fc';
    var badgeStyle = 'background:' + badgeColor + '; color:#fff; padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; margin-right:8px; vertical-align:middle; display:inline-block; margin-bottom:4px;';
    
    // Animação de Fade Out
    tickerEl.style.opacity = 0;
    
    setTimeout(function() {
        tickerEl.innerHTML = '<div style="margin-bottom: 2px;"><span style="' + badgeStyle + '">' + item.source + '</span></div><div style="font-size: 1.1rem; line-height: 1.3; color: #e2e8f0; white-space: normal;">' + item.title + '</div>';
        
        // Animação de Fade In
        tickerEl.style.opacity = 1;
    }, 500);
    
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

// Atualiza o clima, finanças e agenda a cada 15 minutos
setInterval(function() {
    fetchFinance();
    if (currentLat && currentLon) fetchWeather(currentLat, currentLon);
    fetchAgenda();
}, 15 * 60 * 1000);

// Atualiza placar da Copa de forma mais rápida (a cada 1 minuto) para lances ao vivo
setInterval(fetchNews, 1 * 60 * 1000);

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
                var wkEl = document.getElementById('wk-' + idPrefix + '-price');
                if (wkEl) {
                    wkEl.textContent = valStr;
                    wkEl.style.color = varObj.color;
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
initTradeAlerts();
