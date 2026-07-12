import "@testing-library/react/pure";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Automatically unmount and clean up after each test.
// Only runs when jsdom environment is active (hook tests).
afterEach(() => {
  cleanup();
});
