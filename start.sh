#!/bin/bash

echo "🚀 Запуск Actogram..."

# Проверяем Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен"
    exit 1
fi

# Устанавливаем зависимости
echo "📦 Установка зависимостей..."
npm install

# Собираем проект
echo "🔨 Сборка проекта..."
npm run build

# Запускаем сервер
echo "🌐 Запуск сервера..."
npm start
