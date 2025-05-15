// Import pages for routing
import Home from './pages/Home.svelte';
import Preview from './pages/Preview.svelte';
import NotFound from './pages/NotFound.svelte';

// Define routes
export const routes = {
  '/': Home,
  '/preview/:logoName': Preview,
  '*': NotFound
};
