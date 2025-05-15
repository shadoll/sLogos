import Home from './pages/Home.svelte';
import Preview from './pages/Preview.svelte';

// Define all routes for the application
export const routes = {
  '/': Home,
  '/preview/:id': Preview
};
