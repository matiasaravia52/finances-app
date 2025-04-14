import Link from 'next/link'
import Button from '../ui/Button'
import styles from '@/styles/Navbar.module.css'

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.content}>
          <Link href="/dashboard" className={styles.brand}>
            FinanceTracker
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
            <Button>Logout</Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
