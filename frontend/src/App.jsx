import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Sun, Moon, Film, LogOut } from 'lucide-react';
import Intake from './pages/Intake';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Logo from './components/Logo';
import { AdvertModal } from './components/AdvertPlayer';
import { useTheme } from './context/ThemeContext';

function Navigation({ isAuthenticated, setAuth, onOpenAdvert }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  
  const handleLogout = () => {
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token');
    setAuth(false);
  };

  const handleNavClick = () => {
    setIsNavCollapsed(true);
  };
  
  return (
    <nav className="navbar navbar-expand-lg border-bottom sticky-top hero-header py-2">
      <div className="container">
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/" onClick={handleNavClick}>
          <Logo size={36} />
          <span className="fw-bold">Lawyer Tinder</span>
        </Link>
        <button 
          className="navbar-toggler" 
          type="button" 
          aria-expanded={!isNavCollapsed}
          aria-label="Toggle navigation"
          onClick={() => setIsNavCollapsed(!isNavCollapsed)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse ${!isNavCollapsed ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto gap-2 align-items-center">
            <li className="nav-item">
              <button 
                onClick={toggleTheme}
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 px-3 me-lg-1"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun size={16} className="text-warning" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon size={16} className="text-primary" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </li>
            <li className="nav-item">
              <button 
                onClick={() => { onOpenAdvert(); handleNavClick(); }}
                className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1 px-3 me-lg-2"
                title="Watch Lawyer Tinder Commercial"
              >
                <Film size={16} />
                <span>Watch Advert</span>
              </button>
            </li>
            <li className="nav-item">
              <Link 
                onClick={handleNavClick}
                className={`nav-link px-3 rounded ${location.pathname === '/' ? 'active bg-primary text-white fw-medium' : 'fw-medium'}`} 
                to="/"
              >
                Intake Portal
              </Link>
            </li>
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link 
                    onClick={handleNavClick}
                    className={`nav-link px-3 rounded ${location.pathname === '/dashboard' ? 'active bg-primary text-white fw-medium' : 'fw-medium'}`} 
                    to="/dashboard"
                  >
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
                  <button onClick={() => { handleLogout(); handleNavClick(); }} className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1">
                    <LogOut size={14} />
                    <span>Logout</span>
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link 
                  onClick={handleNavClick}
                  className={`nav-link px-3 rounded ${location.pathname === '/login' ? 'active bg-primary text-white fw-medium' : 'fw-medium'}`} 
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
  const [isAdvertOpen, setIsAdvertOpen] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <Router>
      <div className="min-vh-100 d-flex flex-column">
        <Navigation 
          isAuthenticated={isAuthenticated} 
          setAuth={setIsAuthenticated} 
          onOpenAdvert={() => setIsAdvertOpen(true)}
        />
        <div className="flex-grow-1">
          <Routes>
            <Route path="/login" element={<Login setAuth={setIsAuthenticated} onOpenAdvert={() => setIsAdvertOpen(true)} />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Intake onOpenAdvert={() => setIsAdvertOpen(true)} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Dashboard onOpenAdvert={() => setIsAdvertOpen(true)} />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <AdvertModal isOpen={isAdvertOpen} onClose={() => setIsAdvertOpen(false)} />
      </div>
    </Router>
  );
}

export default App;

