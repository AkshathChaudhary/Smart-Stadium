# StadiumAI Command — FIFA World Cup 2026 Smart Stadium Platform

Welcome to **StadiumAI Command**, a next-generation smart stadium operations and fan concierge platform designed for the FIFA World Cup 2026. This platform bridges real-time fan assistance with advanced operations monitoring and AI-driven decision systems.

---

## 🚀 Getting Started

### 📋 Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### ⚙️ Installation
1. Clone or download this repository.
2. Install the necessary packages (Vite, Chart.js, Vitest, and jsdom):
   ```bash
   npm install
   ```

### 💻 Running the Application
To start the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser to explore the dashboard.

### 🧪 Running Tests
The project features a unit test suite to verify internationalization, data simulations, alert systems, and security sanitization:
```bash
npm run test
```

---

## 🛠️ Tech Stack
- **Structure**: HTML5 (Semantic elements)
- **Styling**: Vanilla CSS3 (Custom design system, glassmorphism, responsive grids)
- **Logic**: Vanilla ES Modules (Modular structure)
- **Testing**: Vitest & jsdom
- **Compiler/Bundler**: Vite

---

## 🔒 Security Implementations

Security is built directly into the client-side architecture to prevent vulnerabilities:
1. **XSS Protection (Cross-Site Scripting)**:
   - Dynamic user queries and AI assistant outputs are passed through a custom `escapeHTML` sanitizer in `js/chat.js` before being formatted and injected.
   - This prevents HTML/script injection attacks from running malicious script blocks (`<script>`, `onerror` images, etc.) in the user's browser.
2. **Content Security Policy (CSP)**:
   - A strict CSP meta-tag is configured in `index.html` to limit script and connection endpoints:
     - `default-src 'self'`: Restricts file fetching to local resources.
     - `script-src 'self' https://unpkg.com`: Restricts Javascript execution to local files and the official Lucide icons script on unpkg.
     - `connect-src 'self' https://generativelanguage.googleapis.com`: Restricts network requests to local origins and the Google Gemini API.
     - `img-src 'self' data:`: Permits local assets and base64 SVG favicons.
3. **API Key Safety**:
   - The platform never exposes hardcoded API keys. Keys are inputted by the user in settings, handled locally, and stored securely in the browser's `localStorage` context.

---

## ♿ Accessibility (a11y) Features

StadiumAI is optimized for high screen-reader and keyboard usability:
- **Button labeling**: Added `aria-label` tags to all icon-only interactive controls (menu toggles, settings, notifications, theme switch, chat send).
- **Form Association**: Settings modal labels are explicitly associated with inputs using matching `for` and `id` tags.
- **Graphic Metadata**: Live crowd SVG maps and wayfinding interfaces contain `role="img"` and descriptive `aria-label` strings.
- **Sensory Supports**: Features a dedicated Accessibility Hub providing quiet room paths, live PA announcement captions, and sensory relief center updates.
