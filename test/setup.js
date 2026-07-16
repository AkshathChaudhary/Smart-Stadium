import { vi } from 'vitest';

// Mock global lucide icons generator
global.lucide = {
  createIcons: vi.fn(),
};

// Mock window.scrollTo
window.scrollTo = vi.fn();

// Mock HTML5 Canvas context functions (since JSDOM doesn't support rendering contexts)
HTMLCanvasElement.prototype.getContext = () => {
  return {
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    createImageData: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    createLinearGradient: () => ({ addColorStop: vi.fn() }),
  };
};

// Mock Chart.js/auto module to prevent it from attempting real canvas rendering
vi.mock('chart.js/auto', () => {
  return {
    default: class MockChart {
      constructor(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        this.data = config.data;
        this.options = config.options;
      }
      update() {}
      destroy() {}
    }
  };
});

// Setup mock for global fetch API
global.fetch = vi.fn();
