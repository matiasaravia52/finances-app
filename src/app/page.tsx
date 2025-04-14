'use client';

import Button from '@/components/ui/Button';
import Link from 'next/link';
import styles from '@/styles/Auth.module.css';

export default function Home() {
  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Welcome Back!</h1>
          <p style={{ color: '#4b5563' }}>Please sign in to continue</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Link href="/dashboard" style={{ width: '100%' }}>
            <Button style={{ width: '100%', justifyContent: 'center' }}>
              Continue with Google
            </Button>
          </Link>

          <div className={styles.divider}>
            <div className={styles.dividerLine}>
              <div style={{ width: '100%', borderTop: '1px solid #e5e7eb' }}></div>
            </div>
            <div className={styles.dividerText}>
              <span style={{ padding: '0 0.5rem', backgroundColor: 'white', color: '#6b7280' }}>Or continue with</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="email"
              placeholder="Email"
              className={styles.input}
            />
            <input
              type="password"
              placeholder="Password"
              className={styles.input}
            />
            <Link href="/dashboard" style={{ width: '100%' }}>
              <Button style={{ width: '100%', justifyContent: 'center' }} variant="secondary">
                Sign in with Email
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
