import React from "react";
import ReactDOM from "react-dom/client";
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap CSS
import '@fortawesome/fontawesome-free/css/all.min.css'; // Font Awesome
import 'bootstrap-icons/font/bootstrap-icons.css'; // Bootstrap Icons
import './App.css'; 

import App from './App';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
