import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, AlertCircle, X, Building2 } from 'lucide-react';
import styles from './UserLogin.module.scss';
import axios from 'axios';

interface UserLoginProps {
  onLogin: (username: string) => void;
  onClose: () => void;
  mode: 'login' | 'register';
}

export const UserLogin: React.FC<UserLoginProps> = ({ onLogin, onClose, mode }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const enableBackend = import.meta.env.VITE_ENABLE_BACKEND === '1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register' && password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    if (mode === 'register' && !companyName.trim()) {
      setError('Укажите название компании');
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    if (enableBackend) {
      await axios.post(`${apiUrl}/api/auth`, {
        username,
        password,
        company_name: mode === 'register' ? companyName : undefined
      });
    }

    onLogin(username);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className={styles.closeButton}>
          <X />
        </button>

        <div className={styles.header}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className={styles.icon}
          >
            <User className="w-8 h-8" />
          </motion.div>
          <h2>{mode === 'login' ? 'Вход' : 'Регистрация'}</h2>
          <p>{mode === 'login' ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Имя пользователя</label>
            <div className={styles.inputWrapper}>
              <User />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите имя пользователя"
                required
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className={styles.formGroup}>
              <label>Название компании</label>
              <div className={styles.inputWrapper}>
                <Building2 />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Введите название компании"
                  required
                />
              </div>
            </div>
          )}

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

          {mode === 'register' && (
            <div className={styles.formGroup}>
              <label>Подтвердите пароль</label>
              <div className={styles.inputWrapper}>
                <Lock />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите пароль"
                  required
                />
              </div>
            </div>
          )}

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
            {isLoading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
