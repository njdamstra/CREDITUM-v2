// import logo from './logo.svg';
// import './App.css';
import React from "react";
import Navbar from "./components/Navbar";
import WalletConnect from "./components/WalletConnect";
import Borrower from "./components/Borrower";
import Lender from "./components/Lender";
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import About from './components/About';

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/wallet" element={<WalletConnect />} />
        <Route path="/lender" element={<Lender />} />
        <Route path="/borrower" element={<Borrower />} />
      </Routes>
    </div>
  );
}
// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

export default App;
