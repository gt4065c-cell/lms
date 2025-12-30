import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';  // ← 이 줄 추가
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter basename="/lms">  {/* ← 이 줄 추가 */}
      <App />
    </BrowserRouter>  {/* ← 이 줄 추가 */}
  </React.StrictMode>
);

reportWebVitals();
