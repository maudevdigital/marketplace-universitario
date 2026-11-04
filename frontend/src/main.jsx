import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/tema.css';
import App from './App';
import AvisosProvider from './context/AvisosProvider';
import SesionProvider from './context/SesionProvider';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AvisosProvider>
        <SesionProvider>
          <App />
        </SesionProvider>
      </AvisosProvider>
    </BrowserRouter>
  </StrictMode>,
);
