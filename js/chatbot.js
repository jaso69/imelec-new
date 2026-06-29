/**
 * Imelec Chatbot — Asistente conversacional moderno
 * Reemplaza el widget n8n anterior. Conecta con webhook personalizado
 * manteniendo el historial mediante sessionId persistente por cliente.
 */

(function () {
    'use strict';

    const WEBHOOK_URL = 'https://jmfortiz.jasodev.es/webhook/4d17c7b7-a92b-4a48-8972-7a00519382f2';
    const SESSION_KEY = 'imelec_chat_session_id';
    const MESSAGES_KEY = 'imelec_chat_messages';
    const CHAT_OPEN_KEY = 'imelec_chat_open';

    const AVATAR_IMG = `<img src="img/chatbot.webp" alt="Avatar del asistente" class="imelec-chat-avatar-img">`;

    const TOGGLE_ICON_OPEN = `<img src="img/chatbot.webp" alt="" class="imelec-toggle-robot">`;

    const TOGGLE_ICON_CLOSE = `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;

    const SEND_ICON = `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;

    function generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    function getSessionId() {
        try {
            let id = localStorage.getItem(SESSION_KEY);
            if (!id) {
                id = generateId();
                localStorage.setItem(SESSION_KEY, id);
            }
            return id;
        } catch (e) {
            return generateId();
        }
    }

    function loadMessages() {
        try {
            const raw = localStorage.getItem(MESSAGES_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function saveMessages(messages) {
        try {
            localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages.slice(-50)));
        } catch (e) {
            // Ignorar errores de almacenamiento
        }
    }

    function wasChatOpen() {
        try {
            return localStorage.getItem(CHAT_OPEN_KEY) === 'true';
        } catch (e) {
            return false;
        }
    }

    function setChatOpen(isOpen) {
        try {
            localStorage.setItem(CHAT_OPEN_KEY, isOpen ? 'true' : 'false');
        } catch (e) {
            // Ignorar
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function parseMarkdown(text) {
        // Escapar HTML primero por seguridad
        const safeText = escapeHtml(text);
        const lines = safeText.split(/\n/);
        const groups = [];

        // Agrupar líneas consecutivas del mismo tipo: lista o párrafo
        for (const line of lines) {
            const trimmed = line.trim();
            const isList = /^-\s/.test(trimmed);
            const last = groups[groups.length - 1];

            if (last && last.isList === isList && !isList) {
                last.lines.push(trimmed);
            } else if (last && last.isList === isList && isList) {
                last.lines.push(trimmed);
            } else {
                groups.push({ isList, lines: [trimmed] });
            }
        }

        // Renderizar cada grupo
        const fragments = groups.map(group => {
            if (group.isList) {
                const items = group.lines
                    .filter(line => line.length > 0)
                    .map(line => '<li>' + line.replace(/^-\s*/, '') + '</li>')
                    .join('');
                return items ? '<ul class="imelec-chat-list">' + items + '</ul>' : '';
            }

            const content = group.lines
                .map(line => line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'))
                .join('<br>');
            return content ? '<p>' + content + '</p>' : '';
        });

        return fragments.join('');
    }

    function buildWidget() {
        const container = document.createElement('div');
        container.id = 'imelec-chatbot';
        container.className = 'imelec-chatbot';
        container.setAttribute('role', 'region');
        container.setAttribute('aria-label', 'Asistente de Imelec');

        container.innerHTML = `
            <div class="imelec-chat-window" id="imelec-chat-window" aria-hidden="true">
                <div class="imelec-chat-header">
                    <div class="imelec-chat-avatar">${AVATAR_IMG}</div>
                    <div class="imelec-chat-title">
                        <span class="imelec-chat-name">Asistente Imelec</span>
                        <span class="imelec-chat-status">
                            <span class="imelec-status-dot" aria-hidden="true"></span>
                            En línea
                        </span>
                    </div>
                    <button type="button" class="imelec-chat-close" id="imelec-chat-close" aria-label="Cerrar chat">
                        ${TOGGLE_ICON_CLOSE}
                    </button>
                </div>
                <div class="imelec-chat-messages" id="imelec-chat-messages"></div>
                <div id="imelec-chat-announcer" class="visually-hidden" aria-live="polite" aria-atomic="true"></div>
                <div class="imelec-chat-suggestions" id="imelec-chat-suggestions" aria-label="Sugerencias de preguntas"></div>
                <form class="imelec-chat-form" id="imelec-chat-form" aria-label="Enviar mensaje">
                    <input
                        type="text"
                        class="imelec-chat-input"
                        id="imelec-chat-input"
                        placeholder="Escribe tu consulta..."
                        autocomplete="off"
                        aria-label="Mensaje"
                    />
                    <button type="submit" class="imelec-chat-send" id="imelec-chat-send" aria-label="Enviar">
                        ${SEND_ICON}
                    </button>
                </form>
            </div>
            <button type="button" class="imelec-chat-toggle" id="imelec-chat-toggle" aria-label="Abrir asistente de Imelec">
                <span class="imelec-toggle-label" aria-hidden="true">¿Te ayudamos?</span>
                <span class="imelec-toggle-icon imelec-toggle-open">${TOGGLE_ICON_OPEN}</span>
                <span class="imelec-toggle-icon imelec-toggle-close">${TOGGLE_ICON_CLOSE}</span>
            </button>
        `;

        document.body.appendChild(container);
        return container;
    }

    class Chatbot {
        constructor() {
            this.sessionId = getSessionId();
            this.messages = loadMessages();
            this.isOpen = false;
            this.isTyping = false;

            this.elements = {};
            this.init();
        }

        init() {
            buildWidget();
            this.cacheElements();
            this.bindEvents();
            this.renderMessages();
            this.renderSuggestions();

            if (this.messages.length === 0) {
                this.addBotMessage('¡Hola! Soy el asistente virtual de Imelec. ¿En qué puedo ayudarte hoy?', false);
            }

            if (wasChatOpen()) {
                this.open();
            } else {
                // Mostrar la etiqueta de invitación brevemente al cargar
                this.elements.toggle.classList.add('imelec-toggle-label--visible');
                setTimeout(() => {
                    this.elements.toggle.classList.remove('imelec-toggle-label--visible');
                }, 5000);
            }
        }

        cacheElements() {
            this.elements.root = document.getElementById('imelec-chatbot');
            this.elements.window = document.getElementById('imelec-chat-window');
            this.elements.messages = document.getElementById('imelec-chat-messages');
            this.elements.announcer = document.getElementById('imelec-chat-announcer');
            this.elements.suggestions = document.getElementById('imelec-chat-suggestions');
            this.elements.form = document.getElementById('imelec-chat-form');
            this.elements.input = document.getElementById('imelec-chat-input');
            this.elements.send = document.getElementById('imelec-chat-send');
            this.elements.toggle = document.getElementById('imelec-chat-toggle');
            this.elements.close = document.getElementById('imelec-chat-close');
        }

        bindEvents() {
            this.elements.toggle.addEventListener('click', () => this.toggle());
            this.elements.close.addEventListener('click', () => this.close());
            this.elements.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSend();
            });
            this.elements.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSend();
                }
            });

            // Cerrar con Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });

            // Ajustar altura en móvil cuando aparece el teclado
            if ('visualViewport' in window) {
                window.visualViewport.addEventListener('resize', () => this.adjustForKeyboard());
            }
        }

        adjustForKeyboard() {
            if (!this.isOpen || !window.visualViewport) return;
            const viewportHeight = window.visualViewport.height;
            const windowEl = this.elements.window;
            if (window.innerHeight - viewportHeight > 150) {
                windowEl.style.maxHeight = `${Math.max(320, viewportHeight - 120)}px`;
            } else {
                windowEl.style.maxHeight = '';
            }
        }

        toggle() {
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        }

        open() {
            this.isOpen = true;
            this.elements.root.classList.add('imelec-chatbot--open');
            this.elements.window.setAttribute('aria-hidden', 'false');
            this.elements.toggle.setAttribute('aria-label', 'Cerrar asistente de Imelec');
            this.elements.input.focus();
            this.scrollToBottom();
            setChatOpen(true);
        }

        close() {
            this.isOpen = false;
            this.elements.root.classList.remove('imelec-chatbot--open');
            this.elements.window.setAttribute('aria-hidden', 'true');
            this.elements.toggle.setAttribute('aria-label', 'Abrir asistente de Imelec');
            setChatOpen(false);
        }

        addUserMessage(text) {
            const message = { id: generateId(), role: 'user', text, time: Date.now() };
            this.messages.push(message);
            saveMessages(this.messages);
            this.renderMessage(message);
            this.scrollToBottom();
        }

        addBotMessage(text, save = true) {
            const message = { id: generateId(), role: 'bot', text, time: Date.now() };
            if (save) {
                this.messages.push(message);
                saveMessages(this.messages);
                this.announce('Nuevo mensaje del asistente: ' + message.text.substring(0, 120));
            }
            this.renderMessage(message);
            this.scrollToBottom();
            return message.id;
        }

        updateBotMessage(id, text) {
            const message = this.messages.find(m => m.id === id);
            if (message) {
                message.text = text;
                saveMessages(this.messages);
            }
            const bubble = document.getElementById('imelec-msg-' + id);
            if (bubble) {
                bubble.querySelector('.imelec-chat-bubble-content').innerHTML = parseMarkdown(text);
                this.scrollToBottom();
            }
        }

        renderMessages() {
            this.elements.messages.innerHTML = '';
            this.messages.forEach(msg => this.renderMessage(msg));
            this.scrollToBottom();
        }

        renderMessage(message) {
            const isUser = message.role === 'user';
            const wrapper = document.createElement('div');
            wrapper.className = `imelec-chat-message imelec-chat-message--${isUser ? 'user' : 'bot'}`;
            wrapper.id = 'imelec-msg-' + message.id;

            const time = new Date(message.time).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });

            wrapper.innerHTML = `
                <div class="imelec-chat-bubble">
                    <div class="imelec-chat-bubble-content">${parseMarkdown(message.text)}</div>
                    <span class="imelec-chat-time" aria-hidden="true">${time}</span>
                </div>
            `;

            this.elements.messages.appendChild(wrapper);
        }

        renderSuggestions() {
            const suggestions = [
                '¿Qué servicios ofrecéis?',
                '¿Trabajáis en mi zona?',
                'Quiero pedir presupuesto'
            ];

            this.elements.suggestions.innerHTML = '';
            suggestions.forEach(text => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'imelec-chat-suggestion';
                btn.textContent = text;
                btn.addEventListener('click', () => {
                    this.elements.input.value = text;
                    this.handleSend();
                });
                this.elements.suggestions.appendChild(btn);
            });
        }

        showTyping() {
            const id = 'typing-' + Date.now();
            const wrapper = document.createElement('div');
            wrapper.className = 'imelec-chat-message imelec-chat-message--bot';
            wrapper.id = id;
            wrapper.innerHTML = `
                <div class="imelec-chat-bubble imelec-chat-bubble--typing">
                    <span class="imelec-typing-dot"></span>
                    <span class="imelec-typing-dot"></span>
                    <span class="imelec-typing-dot"></span>
                    <span class="visually-hidden">Escribiendo respuesta</span>
                </div>
            `;
            this.elements.messages.appendChild(wrapper);
            this.scrollToBottom();
            return id;
        }

        removeTyping(id) {
            const el = document.getElementById(id);
            if (el) el.remove();
        }

        scrollToBottom() {
            requestAnimationFrame(() => {
                this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
            });
        }

        announce(text) {
            if (!this.elements.announcer) return;
            this.elements.announcer.textContent = '';
            // Pequeño retardo para asegurar que el lector de pantalla detecta el cambio
            setTimeout(() => {
                this.elements.announcer.textContent = text;
            }, 50);
        }

        async handleSend() {
            const text = this.elements.input.value.trim();
            if (!text || this.isTyping) return;

            this.elements.input.value = '';
            this.elements.suggestions.style.display = 'none';
            this.addUserMessage(text);

            this.isTyping = true;
            this.elements.send.disabled = true;
            this.elements.input.disabled = true;
            const typingId = this.showTyping();

            try {
                const response = await fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, sessionId: this.sessionId })
                });

                if (!response.ok || !response.body) {
                    throw new Error('No se pudo conectar con el asistente');
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let streamedText = '';
                let finalOutput = '';
                let botMessageId = null;

                this.removeTyping(typingId);

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // guardar fragmento incompleto

                    for (const line of lines) {
                        if (!line.trim()) continue;
                        try {
                            const event = JSON.parse(line);
                            if (event.type === 'item' && typeof event.content === 'string') {
                                // El nodo final responde con un JSON que contiene "output"
                                if (event.metadata && event.metadata.nodeName === 'Respond to Webhook') {
                                    try {
                                        const payload = JSON.parse(event.content);
                                        if (payload.output) {
                                            finalOutput = payload.output;
                                        }
                                    } catch (e) {
                                        // No es JSON, tratar como texto normal
                                        streamedText += event.content;
                                    }
                                } else {
                                    streamedText += event.content;
                                }

                                if (streamedText && !botMessageId) {
                                    botMessageId = this.addBotMessage(streamedText, false);
                                } else if (botMessageId) {
                                    this.updateBotMessage(botMessageId, streamedText);
                                }
                            }
                        } catch (e) {
                            // Línea inválida, ignorar
                        }
                    }
                }

                // Preferir el output final si existe; si no, usar el texto acumulado
                const finalText = finalOutput || streamedText || 'Lo siento, no he recibido respuesta.';
                if (botMessageId) {
                    this.updateBotMessage(botMessageId, finalText);
                    // Guardar definitivamente en el historial
                    const msg = this.messages.find(m => m.id === botMessageId);
                    if (msg) {
                        msg.text = finalText;
                        saveMessages(this.messages);
                    }
                    this.announce('Respuesta del asistente: ' + finalText.substring(0, 120));
                } else {
                    this.addBotMessage(finalText);
                }

            } catch (error) {
                this.removeTyping(typingId);
                this.addBotMessage('Disculpa, ha ocurrido un error al contactar con el asistente. Inténtalo de nuevo en unos segundos.');
                // eslint-disable-next-line no-console
                console.error('Imelec Chatbot:', error);
            } finally {
                this.isTyping = false;
                this.elements.send.disabled = false;
                this.elements.input.disabled = false;
                this.elements.input.focus();
                this.scrollToBottom();
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new Chatbot());
    } else {
        new Chatbot();
    }
})();
