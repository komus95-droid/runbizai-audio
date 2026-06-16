# RunBizAI — Аудио менеджер для магазина

Десктопное приложение на Electron + React + TypeScript для управления фоновой музыкой и объявлениями в магазине.

## Возможности

- **Планировщик недели** — визуальная временная шкала с drag & drop объявлений поверх фоновых плейлистов
- **Эквалайзер** — 10-полосный EQ с пресетами, громкость и баланс
- **Библиотека** — управление MP3-папками и файлами объявлений
- Поддержка праздничных дней
- Данные хранятся локально в JSON-файлах

## Быстрый старт

```bash
npm install
npm run dev
```

## Сборка установщика для Windows

```bash
npm run dist
```

Установщик появится в папке `release/`.

## Через GitHub Actions

1. Создай репозиторий на GitHub
2. Залей этот код: `git init && git add . && git commit -m "init" && git remote add origin <URL> && git push -u origin main`
3. Перейди в Actions — сборка запустится автоматически
4. Скачай `.exe` из Artifacts

## Структура данных

Все данные хранятся в `%APPDATA%/runbizai/runbizai-data/`:
- `schedule.json` — расписание по неделям
- `library.json` — плейлисты и объявления
- `eq-presets.json` — настройки эквалайзера

## Технологии

- Electron 28
- React 18 + TypeScript
- Vite 5
- electron-builder (NSIS installer)
