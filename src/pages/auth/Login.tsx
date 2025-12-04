import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks';
import { AuthLayout } from '@/layout';
import { Button, Spinner, Alert } from '@/shared/ui';
import { useState } from 'react';

export default function Login() {
  const navigate = useNavigate();
  const { loginWithTelegram, loading, error: authError } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleTelegramLogin = async () => {
    try {
      setError(null);

      // Пытаемся получить данные из Telegram WebApp
      const telegram = (window as any).Telegram?.WebApp;
      let authData: Record<string, string>;

      if (telegram) {
        const initData = telegram.initData;
        if (!initData) {
          setError('Telegram data not available');
          return;
        }

        // Парсим initData из Telegram
        const params = new URLSearchParams(initData);
        authData = Object.fromEntries(params);
      } else {
        // Fallback для разработки - mock данные
        console.warn('Telegram not available, using mock data for development');
        authData = {
          user: JSON.stringify({
            id: 123456789,
            first_name: 'John',
            last_name: 'Doe',
            username: 'johndoe',
          }),
          auth_date: Math.floor(Date.now() / 1000).toString(),
          hash: 'mock_hash_for_development',
        };
      }

      const result = await loginWithTelegram(authData);

      if (result.success) {
        // Редирект на dashboard
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred during login';
      setError(errorMsg);
    }
  };

  const displayError = error || authError;

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Логотип/Название */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            🚀 Hackathon Teams
          </h1>
          <p className="text-lg text-blue-100">
            Найди идеальную команду для своего проекта
          </p>
        </div>

        {/* Ошибка */}
        {displayError && (
          <Alert
            type="error"
            message={displayError}
            onClose={() => setError(null)}
          />
        )}

        {/* Кнопка логина */}
        <Button
          onClick={handleTelegramLogin}
          disabled={loading}
          size="lg"
          className="w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Spinner size="sm" />
              <span>Входим...</span>
            </>
          ) : (
            <>📱 Войти через Telegram</>
          )}
        </Button>

        {/* Информация */}
        <div className="text-center text-sm text-blue-100 space-y-2">
          <p>🔒 Безопасный вход через Telegram</p>
          <p className="text-xs text-blue-200">
            Ваши данные защищены криптографией Telegram
          </p>
        </div>

        {/* Особенности */}
        <div className="mt-8 space-y-3 text-sm text-blue-100">
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>Быстрая регистрация</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>Поиск по навыкам и роли</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>Управление командой</span>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
