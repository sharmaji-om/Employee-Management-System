// This file starts React and connects shared query settings.
// It mounts the application into the root element in index.html.
// Run npm run dev from the project root to start the app.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './styles.css';
const client = new QueryClient({
  defaultOptions: { queries: { staleTime: 15000, retry: 1, refetchOnWindowFocus: true } },
});
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
