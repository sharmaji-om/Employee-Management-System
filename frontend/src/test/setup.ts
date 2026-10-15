// This file prepares the frontend unit test environment.
// It loads test helpers and cleans up between tests.
// Run npm test from frontend; the test runner loads this file.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
afterEach(cleanup);
