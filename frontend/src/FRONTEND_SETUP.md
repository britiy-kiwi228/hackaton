# 🚀 Hackathon Frontend - Инструкция по запуску

## ✅ Что готово:

### Структура проекта:
- ✅ React 18 + TypeScript + Vite
- ✅ Tailwind CSS (mobile-first)
- ✅ React Router для навигации
- ✅ Структура папок (pages, features, shared)

### API интеграция:
- ✅ `src/shared/api/types.ts` - TypeScript типы для всех моделей
- ✅ `src/shared/api/client.ts` - axios клиент с interceptors
- ✅ `src/shared/api/endpoints.ts` - все API функции
- ✅ Автоматический редирект на /auth при 401

### Custom Hooks:
- ✅ `useAuth` - логин/выход, текущий пользователь
- ✅ `useUser` - профиль пользователя
- ✅ `useFetch` - универсальный хук для запросов
- ✅ `useTeam` - управление командой
- ✅ `useRequests` - приглашения
- ✅ `useRecommendations` - рекомендации
- ✅ `useHackathons` - хакатоны

### UI Компоненты:
- ✅ Button (4 варианта, 3 размера)
- ✅ Input (с ошибками)
- ✅ Select
- ✅ Card
- ✅ Modal
- ✅ Badge
- ✅ Spinner
- ✅ Alert
- ✅ Tabs
- ✅ Avatar

### Страницы:
- ✅ `/auth` - Login с Telegram авторизацией
  - Mock данные для разработки
  - Реальная авторизация через window.Telegram.WebApp
  - Loading состояние
  - Обработка ошибок
  
- ✅ `/dashboard` - Главная страница участника
  - Информация профиля
  - Быстрые ссылки на другие страницы
  - Кнопка выхода
  - Список навыков

### Context:
- ✅ `AuthProvider` - глобальное состояние авторизации
- ✅ `useAuthContext` - хук для доступа к AuthContext

---

## 🔧 Установка и запуск

### 1. Установка зависимостей (если еще не установлены):
```bash
npm install
```

### 2. Запуск dev сервера:
```bash
npm run dev
```

Откроется на: **http://localhost:5173/**

### 3. Сборка для продакшена:
```bash
npm run build
```

---

## 🔐 Авторизация

### Для разработки (без Telegram):
- Нажимаешь "Войти через Telegram"
- Используются mock данные:
  - ID: 123456789
  - Имя: John Doe
  - Username: johndoe

### Для продакшена (с реальным Telegram):
- Интегрируй Telegram Web App
- initData передается автоматически
- Бэкенд проверяет подпись Telegram

---

## 📁 Структура файлов

```
src/
├── pages/
│   ├── auth/
│   │   ├── Login.tsx          ← Страница логина
│   │   └── index.tsx
│   └── participant/
│       ├── dashboard/
│       │   └── index.tsx      ← Dashboard
│       ├── browse/
│       ├── teams/
│       ├── requests/
│       └── profile/
├── shared/
│   ├── api/
│   │   ├── types.ts
│   │   ├── client.ts
│   │   ├── endpoints.ts
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useUser.ts
│   │   ├── useFetch.ts
│   │   ├── useTeam.ts
│   │   ├── useRequests.ts
│   │   ├── useRecommendations.ts
│   │   ├── useHackathons.ts
│   │   └── index.ts
│   └── ui/
│       ├── common/
│       │   ├── Button.tsx
│       │   ├── Card.tsx
│       │   ├── Modal.tsx
│       │   ├── Badge.tsx
│       │   ├── Spinner.tsx
│       │   ├── Alert.tsx
│       │   ├── Tabs.tsx
│       │   ├── Avatar.tsx
│       │   └── index.ts
│       └── form/
│           ├── Input.tsx
│           ├── Select.tsx
│           └── index.ts
├── context/
│   ├── AuthContext.tsx        ← Глобальная авторизация
│   └── index.ts
├── layout/
│   ├── AuthLayout.tsx
│   ├── AppLayout.tsx
│   └── index.ts
├── features/
│   ├── auth/
│   ├── browse/
│   ├── teams/
│   ├── requests/
│   └── profile/
├── App.tsx                    ← Router
├── main.tsx
└── index.css

Config:
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── index.html
└── .env.local
```

---

## 📝 Следующие шаги

### Страницы для разработки:
1. **Browse** (`/browse`) - Поиск участников/команд
   - Фильтры по навыкам, роли
   - Карточки пользователей
   - Кнопка "Отправить приглашение"

2. **Teams** (`/teams`) - Управление командой
   - Создание команды
   - Приглашение участников
   - Управление ролями
   - Список членов

3. **Requests** (`/requests`) - Входящие/исходящие приглашения
   - Входящие приглашения
   - Исходящие приглашения
   - Accept/Decline кнопки

4. **Profile** (`/profile`) - Профиль участника
   - Редактирование имени/био
   - Выбор роли
   - Добавление/удаление навыков
   - Toggle "Готов работать"

5. **Organizer Dashboard** - Для администраторов
   - Аналитика (участники, команды, без команды)
   - CRUD хакатонов
   - Таблица участников
   - Таблица команд
   - Экспорт в CSV

---

## 🌐 Переменные окружения

Создай/обнови `.env.local`:

```
VITE_API_URL=http://localhost:8000
VITE_TELEGRAM_BOT_TOKEN=your_bot_token_here
```

---

## 🔗 API интеграция

Все API методы в `src/shared/api/endpoints.ts`:

```typescript
// Auth
api.auth.loginTelegram(authData)

// Users
api.users.getMe()
api.users.getUser(userId)
api.users.listUsers(params)
api.users.updateProfile(data)
api.users.addSkills(skillNames)
api.users.removeSkill(skillId)

// Teams
api.teams.create(data)
api.teams.getOne(teamId)
api.teams.getList(params)
api.teams.update(teamId, data)
api.teams.join(teamId)
api.teams.leave(teamId)
api.teams.addMember(teamId, userId)
api.teams.removeMember(teamId, userId)

// Requests
api.requests.create(data)
api.requests.getIncoming(params)
api.requests.getOutgoing(params)
api.requests.accept(requestId)
api.requests.decline(requestId)

// Recommendations
api.recommendations.getRecommendations(request)
api.recommendations.getTeamRecommendations(teamId, request)

// Hackathons
api.hackathons.getList(params)
api.hackathons.getOne(hackathonId)
api.hackathons.getCalendar()
api.hackathons.getNotification()
```

---

## 🎨 Использование компонентов

```typescript
// Button
<Button onClick={handleClick} variant="primary" size="md">
  Нажми меня
</Button>

// Input
<Input
  label="Имя"
  placeholder="Введи имя"
  value={name}
  onChange={(e) => setName(e.target.value)}
  error={nameError}
/>

// Card
<Card onClick={handleCardClick}>
  Содержимое карточки
</Card>

// Modal
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Заголовок">
  Содержимое модального окна
  <div slot="actions">
    <Button onClick={handleSave}>Сохранить</Button>
    <Button variant="secondary" onClick={() => setIsOpen(false)}>
      Отмена
    </Button>
  </div>
</Modal>

// Spinner
<Spinner size="md" />

// Alert
<Alert type="success" message="Успешно!" onClose={handleClose} />
```

---

## 🚦 Troubleshooting

### Проблема: Порт 5173 занят
```bash
# Используй другой порт
npm run dev -- --port 3000
```

### Проблема: API не доступен
- Убедись что бэкенд запущен на http://localhost:8000
- Проверь `.env.local` на VITE_API_URL

### Проблема: Ошибки TypeScript
```bash
# Перебилди TypeScript
npm run build
```

### Проблема: Стили Tailwind не загружаются
- Убедись что установлен tailwindcss
- Проверь `tailwind.config.js`
- Перезагрузи страницу в браузере

---

## 📊 Статус

```
✅ Инфраструктура
✅ API интеграция
✅ UI компоненты
✅ Hooks
✅ Авторизация & Router
✅ Login страница
✅ Dashboard страница

⏳ To Do:
- Browse страница
- Teams страница
- Requests страница
- Profile страница
- Organizer Dashboard
- Модал для создания команды
- Фильтры и поиск
- Уведомления
```

---

**Приложение готово к разработке!** 🎉

Запускай `npm run dev` и начинай кодить! 🚀
