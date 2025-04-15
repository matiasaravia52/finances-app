'use client';

import { useState } from 'react';
import styles from '@/styles/Auth.module.css';
import LoginForm from '@/components/forms/LoginForm';
import RegisterForm from '@/components/forms/RegisterForm';
import { AuthProvider } from '@/contexts/AuthContext';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  return (
    <AuthProvider>
      <main className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {activeTab === 'login' ? 'Welcome Back!' : 'Create Account'}
            </h1>
            <p style={{ color: '#4b5563' }}>
              {activeTab === 'login' 
                ? 'Please sign in to continue' 
                : 'Register to start managing your finances'}
            </p>
          </div>

          <div className={styles.authTabs}>
            <div 
              className={`${styles.authTab} ${activeTab === 'login' ? styles.authTabActive : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </div>
            <div 
              className={`${styles.authTab} ${activeTab === 'register' ? styles.authTabActive : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Register
            </div>
          </div>

          {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>
      </main>
    </AuthProvider>
  );
}
