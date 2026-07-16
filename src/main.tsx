import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { CartProvider } from './contexts/CartContext';
// 1. استيراد BrowserRouter هنا
import { BrowserRouter } from 'react-router-dom'; 

// منع التظليل التلقائي للنصوص على مستوى المتصفح
document.addEventListener('contextmenu', (event) => event.preventDefault());
document.onselectstart = () => false;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CartProvider>
      {/* 2. تغليف التطبيق بالكامل بـ BrowserRouter */}
      <BrowserRouter> 
        <App />
      </BrowserRouter>
    </CartProvider>
  </StrictMode>,
);
