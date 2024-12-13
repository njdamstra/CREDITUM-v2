import React from "react";
// import { Link } from "react-router-dom";
import { Link } from 'react-router-dom';




// function Navbar() {
//   return (
//     <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
//       <div className="container">
//         <a className="navbar-brand" href="/">
//           UserPortal DApp
//         </a>
//       </div>
//     </nav>
//   );
// }


function Navbar() {
    return (
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/wallet">WalletConnect</Link>
          </li>
          <li>
            <Link to="/lender">Lender</Link>
          </li>
          <li>
            <Link to="/borrower">Borrower</Link>
          </li>
        </ul>
      </nav>
    );
  }

// const Navbar = () => {
//   return (
//     <nav className="navbar navbar-expand-lg navbar-light bg-light">
//       <Link className="navbar-brand" to="/">DeFi App</Link>
//       <div className="collapse navbar-collapse">
//         <ul className="navbar-nav">
//           <li className="nav-item">
//             <Link className="nav-link" to="/borrower">Borrower</Link>
//           </li>
//           <li className="nav-item">
//             <Link className="nav-link" to="/lender">Lender</Link>
//           </li>
//         </ul>
//       </div>
//     </nav>
//   );
// };

export default Navbar;
