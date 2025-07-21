import { vi } from 'vitest';
import '@testing-library/jest-dom';
// Alias Jest's global API to Vitest's implementation for compatibility
(globalThis as any).jest = vi;
