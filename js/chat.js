/* ============================================================
   StadiumAI Command — Fan Chatbot UI Manager
   Renders user/AI messages and interfaces with GeminiService
   ============================================================ */

import { sanitizeInput, escapeHTML } from './security.js';

export class ChatManager {
  constructor(geminiService) {
    this.gemini = geminiService;
    this.messagesContainer = document.getElementById('chatMessages');
    this.input = document.getElementById('chatInput');
    this.sendBtn = document.getElementById('chatSendBtn');
    this.clearBtn = document.getElementById('clearChatBtn');
    this.quickChips = document.getElementById('quickActions');

    this.currentLanguage = 'en';

    this.init();
  }

  init() {
    this.setupListeners();
    this.addWelcomeMessage();
  }

  setupListeners() {
    // Enable send button on text input
    this.input?.addEventListener('input', () => {
      this.sendBtn.disabled = !this.input.value.trim();
    });

    // Send on Enter
    this.input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !this.sendBtn.disabled) {
        this.handleSend();
      }
    });

    // Send on click
    this.sendBtn?.addEventListener('click', () => {
      if (!this.sendBtn.disabled) {
        this.handleSend();
      }
    });

    // Clear chat log
    this.clearBtn?.addEventListener('click', () => {
      this.messagesContainer.innerHTML = '';
      this.addWelcomeMessage();
    });

    // Quick chips selector
    this.quickChips?.addEventListener('click', (e) => {
      const chip = e.target.closest('.quick-action-chip');
      if (chip) {
        const query = chip.getAttribute('data-query');
        this.input.value = query;
        this.sendBtn.disabled = false;
        this.handleSend();
      }
    });
  }

  setLanguage(lang) {
    this.currentLanguage = lang;
  }

  addWelcomeMessage() {
    const welcomeTexts = {
      en: "👋 **Welcome to MetLife Stadium!** I am your AI Concierge for today's match. Ask me about seating navigation, parking options, accessibility details, restrooms, or current match scores. I can communicate in 10+ languages! How can I help you?",
      es: "👋 **¡Bienvenido al MetLife Stadium!** Soy tu Asistente de IA para el partido de hoy. Pregúntame sobre navegación de asientos, estacionamiento, detalles de accesibilidad o baños. ¡Puedo hablar más de 10 idiomas!",
      fr: "👋 **Bienvenue au MetLife Stadium !** Je suis votre concierge IA. Posez-moi des questions sur les places, le parking, l'accessibilité ou les toilettes. Je parle plus de 10 langues !",
      zh: "👋 **欢迎来到大都会人寿体育场！** 我是您今天的 AI 助理。您可以向我咨询座位导航、停车场选择、无障碍设施或洗手间位置。我支持10多种语言！",
      pt: "👋 **Bem-vindo ao MetLife Stadium!** Sou o seu Concierge de IA para a partida de hoje. Pergunte-me sobre localização de assentos, estacionamento, acessibilidade, banheiros ou placar ao vivo.",
      ar: "👋 **مرحبًا بكم في ملعب ميتلايف!** أنا بواب الذكاء الاصطناعي الخاص بك لمباراة اليوم. اسألني عن اتجاهات المقاعد، ومواقف السيارات، وتفاصيل سهولة الوصول، ودورات المياه، أو نتائج المباريات.",
      ja: "👋 **メットライフ・スタジアムへようこそ！** 本日の試合のAIコンシェルジュです。座席案内、駐車場、バリアフリー情報、お手洗い、ライブスコアについて何でもお尋ねください。",
      ko: "👋 **메트라이프 스타디움에 오신 것을 환영합니다!** 오늘 경기의 AI 컨시어지입니다. 좌석 위치, 주차 정보, 교통약자 지원 시설, 화장실, 실시간 경기 점수 등에 대해 물어보세요.",
      de: "👋 **Willkommen im MetLife Stadium!** Ich bin Ihr KI-Concierge für das heutige Spiel. Fragen Sie mich nach Sitzplatzsuche, Parkplätzen, Barrierefreiheit, Toiletten oder dem aktuellen Spielstand.",
      hi: "👋 **मेटलाइफ स्टेडियम में आपका स्वागत है!** मैं आज के मैच के लिए आपका एआई गाइड हूँ। मुझसे सीटों के दिशा-निर्देश, पार्किंग, सुलभता विवरण, शौचालय या लाइव स्कोर के बारे में पूछें।"
    };

    const text = welcomeTexts[this.currentLanguage] || welcomeTexts.en;
    this.addMessage(text, 'ai');
  }

  async handleSend() {
    const rawMessage = this.input.value.trim();
    if (!rawMessage) return;

    // Sanitize user input before processing
    const message = sanitizeInput(rawMessage);
    if (!message) return;

    // 1. Add user message
    this.addMessage(message, 'user');
    this.input.value = '';
    this.sendBtn.disabled = true;

    // 2. Add typing indicator
    const typingIndicator = this.addTypingIndicator();

    // 3. Request Gemini response
    const start = Date.now();
    const response = await this.gemini.sendMessage(message, this.currentLanguage);
    const duration = Date.now() - start;

    // 4. Remove typing indicator and add AI response
    typingIndicator.remove();
    this.addMessage(response.text, 'ai');
  }

  addMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = `message ${sender}`;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const avatar = sender === 'ai' ? '🤖' : '👤';

    // Escape HTML first to prevent XSS
    const escapedText = escapeHTML(text);
    // Render markdown headings and list elements
    const formattedText = this.formatMarkdown(escapedText);

    msg.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        ${formattedText}
        <span class="message-time">${timeStr}</span>
      </div>
    `;

    this.messagesContainer.appendChild(msg);
    this.scrollToBottom();
  }

  escapeHTML(str) {
    return escapeHTML(str);
  }

  addTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator alert-slide-in';
    indicator.innerHTML = `
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span>StadiumAI is analyzing request...</span>
    `;
    this.messagesContainer.appendChild(indicator);
    this.scrollToBottom();
    return indicator;
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  formatMarkdown(text) {
    // Simple markdown formatting for bold, list, headers, emoji placeholders
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>')
      .replace(/• (.*?)(<br>|$)/g, '<li>$1</li>');

    // Wrap list items in ul
    if (html.includes('<li>')) {
      // Find consecutive list items and wrap them
      html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
    }

    return html;
  }
}
