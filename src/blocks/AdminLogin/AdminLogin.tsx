import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, User, AlertCircle } from 'lucide-react';
import styles from './AdminLogin.module.scss';

interface AdminLoginProps {
  onLogin: (username: string, password: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    if (username === 'admin' && password === '12345') {
      onLogin(username, password);
    } else {
      setError('Неверный логин или пароль');
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.wrapper}
      >
        <div className={styles.logoContainer}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className={styles.logo}
          >
            <ShieldCheck className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className={styles.title}>МТСОблачко</h1>
          <p className={styles.subtitle}>Админ-панель</p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className={styles.formContainer}
        >
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Логин</label>
              <div className={styles.inputWrapper}>
                <User />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введите логин"
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Пароль</label>
              <div className={styles.inputWrapper}>
                <Lock />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.error}
              >
                <AlertCircle />
                <span>{error}</span>
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className={styles.submitButton}
            >
              {isLoading ? <div className={styles.spinner} /> : 'Войти'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};
