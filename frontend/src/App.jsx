import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Intake from './pages/Intake';
import Dashboard from './pages/Dashboard';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-secondary sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
          ⚖️ <span className="text-white">Lawyer Tinder</span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto gap-2">
            <li className="nav-item">
              <Link 
                className={`nav-link px-3 rounded ${location.pathname === '/' ? 'active bg-primary text-white' : 'text-slate-300 hover-text-white'}`} 
                to="/"
              >
                Intake Portal
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link px-3 rounded ${location.pathname === '/dashboard' ? 'active bg-primary text-white' : 'text-slate-300 hover-text-white'}`} 
                to="/dashboard"
              >
                Lawyer Dashboard
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-vh-100 d-flex flex-column bg-dark text-white">
        <Navigation />
        <div className="flex-grow-1">
          <Routes>
            <Route path="/" element={<Intake />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
