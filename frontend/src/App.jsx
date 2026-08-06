import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Intake from './pages/Intake';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Logo from './components/Logo';

function Navigation({ isAuthenticated, setAuth }) {
  const location = useLocation();
  
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setAuth(false);
  };
  
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-secondary sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
          <Logo size={36} />
          <span className="text-white">Lawyer Tinder</span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto gap-2 align-items-center">
            <li className="nav-item">
              <Link 
                className={`nav-link px-3 rounded ${location.pathname === '/' ? 'active bg-primary text-white' : 'text-slate-300 hover-text-white'}`} 
                to="/"
              >
                Intake Portal
              </Link>
            </li>
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link 
                    className={`nav-link px-3 rounded ${location.pathname === '/dashboard' ? 'active bg-primary text-white' : 'text-slate-300 hover-text-white'}`} 
                    to="/dashboard"
                  >
                    Lawyer Dashboard
                  </Link>
                </li>
                <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
                  <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link 
                  className={`nav-link px-3 rounded ${location.pathname === '/login' ? 'active bg-primary text-white' : 'text-slate-300 hover-text-white'}`} 
                  to="/login"
                >
                  Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

const ProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <Router>
      <div className="min-vh-100 d-flex flex-column bg-dark text-white">
        <Navigation isAuthenticated={isAuthenticated} setAuth={setIsAuthenticated} />
        <div className="flex-grow-1">
          <Routes>
            <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Intake />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
