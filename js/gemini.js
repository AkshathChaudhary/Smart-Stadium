/* ============================================================
   StadiumAI Command — Gemini API Integration
   Wraps the Google Gemini API for AI-powered features
   ============================================================ */

export class GeminiService {
  constructor() {
    this.apiKey = localStorage.getItem('stadiumai_api_key') || '';
    this.model = 'gemini-2.0-flash';
    this.isAvailable = false;
    this.genAI = null;
    this.chat = null;

    this.systemPrompt = `You are "StadiumAI Concierge" — an expert AI assistant for the FIFA World Cup 2026, currently deployed at a smart stadium. You help fans, staff, and organizers with:

1. **Navigation**: Directions to seats, restrooms, food courts, first aid, exits, elevators, ramps.
2. **Match Info**: Current score, upcoming matches, player info, tournament schedule.
3. **Accessibility**: Wheelchair routes, sensory rooms, audio descriptions, service animal areas.
4. **Food & Services**: Menu options, dietary accommodations, wait times, merchandise.
5. **Transportation**: Parking, public transit, rideshare, shuttles, post-match exit plans.
6. **Stadium Rules**: Bag policy, prohibited items, re-entry, smoking areas.
7. **Emergency**: First aid locations, emergency exits, security contacts.
8. **Sustainability**: Green initiatives, water stations, recycling, carbon offset programs.

FOOTBALL KNOWLEDGE — You are also a football (soccer) encyclopedia. Answer questions about:
9. **Football Rules**: Offside, fouls, penalties, VAR, substitutions, extra time, penalty shootouts, handball rules, advantage rule, yellow/red cards.
10. **FIFA World Cup History**: Past winners (Brazil 5, Germany 4, Italy 4, Argentina 3, France 2, Uruguay 2, England 1, Spain 1), memorable matches, golden boot winners, records, host nations.
11. **FIFA World Cup 2026**: 48-team format, host nations (USA, Canada, Mexico), group stage details, venue cities, schedule, qualification.
12. **Player Info**: Current rosters for major teams, star players (Mbappé, Vinícius Jr., Bellingham, Haaland, Messi, etc.), career stats, club affiliations, positions.
13. **Team Tactics**: Formations (4-3-3, 4-4-2, 3-5-2, etc.), playing styles, team strengths and weaknesses.
14. **Tournament Predictions & Analysis**: Provide thoughtful opinions on match outcomes, dark horses, favorites, and tactical matchups when asked.
15. **Football Trivia**: Fun facts, records, historic moments (Maradona's Hand of God, Zidane's headbutt, Leicester City miracle, etc.).

APP KNOWLEDGE — You can explain the StadiumAI Command platform:
16. **Dashboard Overview**: The Operations mode shows real-time crowd heatmap, gate throughput, AI alerts, staff deployment, and sustainability metrics.
17. **Crowd Heatmap**: An interactive SVG map showing live occupancy by zone. Color-coded: Green (low), Yellow (moderate), Orange (high), Red (critical). Click zones for details. The heatmap has a 3D hover effect.
18. **Theme Toggle**: Users can switch between Dark and Light mode using the sun/moon icon in the top-right header.
19. **AI Assistant (Chat)**: This chatbot — supports 10+ languages, quick action chips for common queries, real-time match info in the sidebar.
20. **Navigation Page**: Interactive wayfinding map with quick-navigate buttons, accessible route toggle, and AI routing tips.
21. **Sustainability Dashboard**: Tracks energy (MW), water usage (liters), CO₂ emissions, with AI recommendations for optimization.
22. **Language Support**: The app supports English, Spanish, French, Portuguese, Arabic, Chinese, Japanese, Korean, German, and Hindi.
23. **Settings**: Users can change their Gemini API key and data refresh rate (2s, 5s, 10s) via the ⚙️ Settings button.

GUIDELINES:
- Be friendly, concise, and helpful. Use emojis for visual appeal.
- Always provide specific locations (e.g., "Gate B, Level 1") when giving directions.
- If asked in another language, respond in that same language.
- For safety/emergency questions, always prioritize directing to nearest help.
- Include estimated walking times when giving directions.
- If you don't know something specific, say so and suggest contacting Guest Services.
- For football questions, provide detailed and accurate answers. You love football and are passionate about it.
- For app questions, guide users step-by-step on how to use features.

CURRENT VENUE CONTEXT:
- Venue: MetLife Stadium, East Rutherford, NJ
- Capacity: 82,500
- Current Match: Brazil vs France (Group Stage)
- Match Status: 2nd Half, ~67th minute
- Current Score: Brazil 2 - France 1
- Weather: 24°C / 75°F, Partly Cloudy
- Gates: A (Main/North), B (Northeast), C (East), D (South), E (West), F (Northwest), VIP (East Premium), Media (West)
- Levels: Field Level, Lower Bowl (100s), Mid Bowl (200s), Upper Bowl (300s), Club Level, Suites
- Food Courts: Main Concourse (multiple vendors), Level 2 Bar & Grill, VIP Lounge
- Accessibility: 4 Elevators, 8 Ramp Access Points, Sensory Room (Level 1 near Gate C), Accessible Parking (Lot A & B)
- Current Wait Times: Restrooms ~3min, Food ~8min, Bar ~12min, Merch ~6min`;

    this._init();
  }

  async _init() {
    if (!this.apiKey) {
      console.log('[GeminiService] No API key found. Running in mock mode.');
      this.isAvailable = false;
      return;
    }
    // Verify apiKey is not a mock or empty string
    if (this.apiKey.trim().length > 10) {
      this.isAvailable = true;
      console.log('[GeminiService] Initialized with API Key endpoint configuration.');
    } else {
      this.isAvailable = false;
    }
  }

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('stadiumai_api_key', key);
    this._init();
  }

  async sendMessage(userMessage, language = 'en') {
    // Add language context if not English
    let prompt = userMessage;
    if (language !== 'en') {
      const langNames = {
        es: 'Spanish', fr: 'French', pt: 'Portuguese', ar: 'Arabic',
        zh: 'Chinese', ja: 'Japanese', ko: 'Korean', de: 'German', hi: 'Hindi'
      };
      prompt = `[Respond in ${langNames[language] || 'English'}] ${userMessage}`;
    }

    if (this.isAvailable && this.apiKey) {
      try {
        return await this._sendToGemini(prompt, language);
      } catch (err) {
        console.warn('[GeminiService] Live request failed, falling back to mock:', err);
        return this._generateMockResponse(userMessage, language);
      }
    } else {
      return this._generateMockResponse(userMessage, language);
    }
  }

  async _sendToGemini(prompt, language = 'en') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
    
    // Inject dynamic system prompt to enforce target language response
    let systemInstructionText = this.systemPrompt;
    if (language !== 'en') {
      const langNames = {
        es: 'Spanish', fr: 'French', pt: 'Portuguese', ar: 'Arabic',
        zh: 'Chinese', ja: 'Japanese', ko: 'Korean', de: 'German', hi: 'Hindi'
      };
      const targetLang = langNames[language] || 'English';
      systemInstructionText += `\n\nCRITICAL: The user has selected ${targetLang} as their language. You MUST respond exclusively in ${targetLang}. Do not output any English text unless it is a proper noun or code. Translate all labels, advice, directions, and greetings into ${targetLang}.`;
    }

    const body = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      systemInstruction: {
        parts: [{ text: systemInstructionText }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!candidateText) {
      throw new Error('Invalid response structure from Gemini API');
    }

    return {
      text: candidateText,
      source: 'gemini'
    };
  }

  _generateMockResponse(message, language) {
    const lowerMsg = message.toLowerCase();

    // Smart keyword matching for mock responses
    const responses = {
      restroom: `🚻 **Nearest Restrooms:**\n\n📍 **Closest**: Section 100 concourse — **45 meters** (~1 min walk)\n📍 **Least busy**: Level 2, near Gate E — **90 meters** (~2 min walk), current wait ~2 min\n📍 **Accessible**: Near Gate B elevator — **60 meters**, fully wheelchair accessible\n\n💡 *Tip: Level 2 restrooms typically have 40% shorter wait times during halftime!*`,
      
      food: `🍔 **Food Options Nearby:**\n\n🌮 **Taco Town** — Concourse C (60m) — Wait: ~5 min\n🍕 **Stadium Pizza** — Main Concourse (80m) — Wait: ~8 min\n🌿 **Green Bowl** — Level 2 (110m) — Vegetarian/Vegan — Wait: ~3 min\n🍺 **Craft Bar** — Level 2 Lounge (95m) — Wait: ~12 min\n\n💡 *AI Tip: Green Bowl on Level 2 has the shortest wait right now and offers gluten-free options!*`,
      
      seat: `💺 **Finding Your Seat:**\n\n1️⃣ Look for your **section number** on your ticket (e.g., Section 214)\n2️⃣ Follow the signs on the main concourse — sections are numbered clockwise\n3️⃣ For **Sections 200-230**: Take the escalator or elevator to Level 2\n4️⃣ Ushers at each section entrance will help you find your exact row & seat\n\n📍 Need directions to a specific section? Just tell me the number!\n\n💡 *Your ticket also works as a digital map in the FIFA World Cup app!*`,
      
      accessibility: `♿ **Accessibility Services:**\n\n🛗 **Elevators**: 4 locations — Gates A, B, D, F (all operational)\n🔄 **Ramps**: 8 access points across all levels\n🤫 **Sensory Room**: Level 1, near Gate C — quiet space with dimmed lighting\n📝 **Live Captioning**: All PA announcements captioned on venue screens\n🎧 **Audio Description**: FM 87.7 or in-app streaming\n🐕‍🦺 **Service Animals**: Relief areas at Gates A, D, F\n🅿️ **Accessible Parking**: Lots A & B — 23 spots available\n\n💡 *Toggle "Accessible Routes" in the Navigate tab for elevator/ramp-only directions!*`,
      
      score: `⚽ **Live Match Update:**\n\n🇧🇷 **Brazil 2** — 🇫🇷 **France 1**\n\n⏱️ **67th minute** — 2nd Half\n\n⚽ Goals:\n• 🇧🇷 Vinícius Jr. — 23' (assisted by Rodrygo)\n• 🇫🇷 Mbappé — 38' (penalty)\n• 🇧🇷 Endrick — 61' (assisted by Paquetá)\n\n📊 Possession: Brazil 54% — France 46%\n🎯 Shots on Target: Brazil 6 — France 4\n\n🏟️ Attendance: 82,500 (Full house!)`,

      'first aid': `🏥 **First Aid Locations:**\n\n📍 **Main Medical Station**: Level 1, near Gate A — **120 meters**\n📍 **Secondary Station**: Level 2, Section 215 — **80 meters**\n📍 **Field-Level Medical**: Players tunnel area (staff only)\n\n🚨 **Emergency?** Flag any staff member or call venue security: **+1-555-STADIUM**\n\n💡 *AED defibrillators are located at every gate entrance and medical station.*`,

      exit: `🚗 **Post-Match Exit Plan:**\n\n🧠 **AI Recommendation**: For the fastest exit, consider:\n\n1️⃣ **Leave 5 min early** via Gate D (south) — currently lowest traffic\n2️⃣ **Wait 15 min after final whistle** — crowd density drops 50% by then\n\n🚇 **Train**: NJ Transit runs extra services until midnight\n🚌 **Shuttle**: Every 8 min from Gate E to Secaucus Junction\n🚗 **Driving**: Lot C & D exit first (direct highway access)\n🚕 **Rideshare**: Designated pickup at Lot F — current wait ~12 min\n\n💡 *Staggered exits reduce wait times by ~40%. No rush — the trains run late tonight!*`,

      stadium: `🏟️ **MetLife Stadium — Quick Facts:**\n\n📍 East Rutherford, New Jersey\n👥 Capacity: 82,500\n🏗️ Opened: 2010 | Renovated: 2025 for FIFA WC\n📏 4 Levels: Field, Lower Bowl, Mid Bowl, Upper Bowl\n🚪 8 Entry Gates (A through F, VIP, Media)\n\n🌟 **FIFA 2026 Upgrades:**\n• Digital Twin crowd monitoring\n• 5G connectivity throughout\n• AI-powered wayfinding\n• Solar panels covering 40% of roof\n• Rainwater harvesting system\n\n🌐 Hosting **8 matches** including a Semifinal!\n\n💡 *Fun fact: MetLife is one of the largest stadiums in the NFL and has been transformed into a smart stadium for the World Cup!*`,

      hello: `👋 **Welcome to StadiumAI!**\n\nI'm your AI concierge for today's match at MetLife Stadium! 🏟️\n\nI can help you with:\n• 🧭 **Navigation** — Find your seat, restrooms, food\n• ⚽ **Match Info** — Live scores, stats\n• ♿ **Accessibility** — Wheelchair routes, sensory rooms\n• 🍔 **Food & Drinks** — Menus, wait times\n• 🚗 **Transportation** — Parking, trains, exit plans\n• 🏥 **Emergency** — First aid, security\n\nJust ask me anything! I speak 10+ languages 🌍`,

      weather: `🌤️ **Current Venue Conditions:**\n\n🌡️ Temperature: **24°C / 75°F**\n💧 Humidity: **55%**\n🌬️ Wind: Light breeze, 8 km/h\n☁️ Sky: Partly cloudy\n🔊 Noise Level: **92 dB** (typical match atmosphere)\n\n💡 *The retractable vents are open for natural airflow. Stay hydrated — free water stations at every concourse level!*`,
    };

    // Find matching response
    let responseText = responses.hello; // default
    for (const [keyword, response] of Object.entries(responses)) {
      if (lowerMsg.includes(keyword)) {
        responseText = response;
        break;
      }
    }

    // Handle unrecognized queries
    if (!Object.keys(responses).some(k => lowerMsg.includes(k))) {
      responseText = `🤔 Great question! While I don't have specific information about that right now, here's what I suggest:\n\n📍 **Guest Services** — Available at every gate entrance\n📞 **Info Hotline**: +1-555-STADIUM\n📱 **FIFA App**: Full venue map and real-time updates\n\nOr try asking me about:\n• 🧭 Navigation & directions\n• ⚽ Match scores & stats\n• 🍔 Food options & wait times\n• ♿ Accessibility services\n• 🚗 Transportation & exit plans`;
    }

    return {
      text: responseText,
      source: 'mock'
    };
  }
}
