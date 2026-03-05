import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, AlertCircle, X, Building2, Trash2 } from 'lucide-react';
import styles from './UserLogin.module.scss';
import { apiRequest, enableBackend } from '../../lib/api';

interface UserLoginProps {
  onLogin: (username: string) => void;
  onClose: () => void;
  mode: 'login' | 'register';
}

const setCookie = (name: string, value: string, days = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
};

const getCookie = (name: string): string => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : '';
};

const getProfiles = (): string[] => {
  const profiles = getCookie('user_profiles');
  return profiles ? JSON.parse(decodeURIComponent(profiles)) : [];
};

const saveProfile = (username: string) => {
  const profiles = getProfiles();
  if (!profiles.includes(username)) {
    profiles.unshift(username);
    setCookie('user_profiles', encodeURIComponent(JSON.stringify(profiles.slice(0, 5))), 365);
  }
};

const removeProfile = (username: string) => {
  const profiles = getProfiles().filter(p => p !== username);
  setCookie('user_profiles', encodeURIComponent(JSON.stringify(profiles)), 365);
};

export const UserLogin: React.FC<UserLoginProps> = ({ onLogin, onClose, mode }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<string[]>([]);

  useEffect(() => {
    if (mode === 'login') setSavedProfiles(getProfiles());
  }, [mode]);

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
      try {
        const endpoint = mode === 'login' ? '/v1/login/' : '/v1/register/';
        const data = mode === 'login'
          ? { username, password }
          : { username, password, company_name: companyName };

        const tokens = await apiRequest<{ access: string; refresh: string }>(
          'POST',
          endpoint,
          data
        );

        setCookie('access_token', tokens.access);
        setCookie('refresh_token', tokens.refresh);

        console.log('Токены:', tokens);
      } catch (err) {
        setError('Ошибка при выполнении запроса');
        setIsLoading(false);
        return;
      }
    }

    saveProfile(username);
    onLogin(username);
  };

  const handleSelectProfile = (profile: string) => {
    setUsername(profile);
  };

  const handleDeleteProfile = (profile: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeProfile(profile);
    setSavedProfiles(getProfiles());
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
          <h2>МТСОблачко</h2>
          <p className={styles.subtitle}>{mode === 'login' ? 'Вход' : 'Регистрация'}</p>
          <p className={styles.description}>{mode === 'login' ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}</p>
        </div>

        {mode === 'login' && savedProfiles.length > 0 && (
          <div className={styles.savedProfiles}>
            <p className={styles.savedProfilesTitle}>Сохраненные профили:</p>
            <div className={styles.profilesList}>
              {savedProfiles.map((profile) => (
                <button
                  key={profile}
                  type="button"
                  onClick={() => handleSelectProfile(profile)}
                  className={styles.profileItem}
                >
                  <User />
                  <span>{profile}</span>
                  <button
                    onClick={(e) => handleDeleteProfile(profile, e)}
                    className={styles.deleteProfile}
                    title="Удалить профиль"
                  >
                    <Trash2 />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

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
