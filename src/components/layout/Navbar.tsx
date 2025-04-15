import Link from 'next/link'
import Button from '../ui/Button'
import styles from '@/styles/Navbar.module.css'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es un dispositivo móvil
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Comprobar al cargar
    checkIfMobile();
    
    // Comprobar al cambiar el tamaño de la ventana
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Cerrar el menú al hacer clic en un enlace
  const handleNavLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.content}>
          <Link href="/dashboard" className={styles.brand}>
            FinanceTracker
          </Link>
          
          {/* Botón de menú hamburguesa para móviles */}
          {isMobile && (
            <button 
              className={styles.menuButton} 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </button>
          )}
          
          {/* Menú para escritorio o menú móvil desplegado */}
          <div 
            className={`${styles.navLinks} ${isMobile ? (isMenuOpen ? styles.menuOpen : styles.menuClosed) : ''}`}
          >
            {user && (
              <div className={styles.userInfo}>
                Welcome, {user.name}
              </div>
            )}
            <Link href="/dashboard" onClick={handleNavLinkClick}>
              <Button variant="outline">Dashboard</Button>
            </Link>
            <Link href="/profile" onClick={handleNavLinkClick}>
              <Button variant="outline">Profile</Button>
            </Link>
            <Button onClick={() => { logout(); handleNavLinkClick(); }}>Logout</Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
