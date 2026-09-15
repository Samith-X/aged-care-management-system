import { supabase } from './lib/supabaseClient';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppDataProvider } from './context/AppDataContext';
import './styles.css';

supabase
  .from('app_status')
  .select('message')
  .eq('id', 1)
  .single()
  .then(({ data, error }) => {
    if (error) {
      console.error('Supabase connection error:', error);
    } else {
      console.log('Supabase connected:', data.message);
    }
  });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppDataProvider>
        <App />
      </AppDataProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
