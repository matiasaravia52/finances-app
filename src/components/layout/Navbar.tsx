import Link from 'next/link'
import Button from '../ui/Button'
import styles from '@/styles/Navbar.module.css'
import { useAuth } from '@/contexts/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.content}>
          <Link href="/dashboard" className={styles.brand}>
            FinanceTracker
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user && (
              <div className={styles.userInfo}>
                Welcome, {user.name}
              </div>
            )}
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline">Profile</Button>
            </Link>
            <Button onClick={logout}>Logout</Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
