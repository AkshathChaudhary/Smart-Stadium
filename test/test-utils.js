import fs from 'fs';
import path from 'path';

/**
 * Loads the main index.html file into the jsdom document context.
 */
export function loadHTMLTemplate() {
  const filePath = path.resolve(__dirname, '../index.html');
  const html = fs.readFileSync(filePath, 'utf8');
  document.documentElement.innerHTML = html;
}

/**
 * Helper to wait for a number of milliseconds.
 * Useful for simulating network latency and waiting for DOM transitions.
 * @param {number} ms 
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
