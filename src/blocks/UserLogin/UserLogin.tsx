import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, AlertCircle, X } from 'lucide-react';
import styles from './UserLogin.module.scss';
import axios from 'axios';

interface UserLoginProps {
  onLogin: (username: string, password: string) => void;
  onClose: () => void;
  mode: 'login' | 'register';
}

export const UserLogin: React.FC<UserLoginProps> = ({ onLogin, onClose, mode }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = import.meta.env.DB_HOST

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Пароли не совпадают');
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Пароль должен быть не менее 6 символов');
        setIsLoading(false);
        return;
      }
    }

    if (username && password) {
        const requestData = {
          username,
          password,
          company_name: mode === 'register' ? 'Default Company' : undefined // или возьми из формы
        };

        const response = await axios.post(`${apiUrl}/api/auth`, requestData); // замени URL на свой

        // Успешный ответ 
        if (response) {
          onLogin(username, password);
        }

    } else {
      setError('Заполните все поля');
      setIsLoading(false);
    }
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
