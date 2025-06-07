
import TelegramBot from 'node-telegram-bot-api';
import admin from './admin-db.js';

// Замените на ваш токен бота
const BOT_TOKEN = process.env.BOT_TOKEN || '5000209585:AAFmEPGgBqhpOpiBdcCLVzVlrF0sF6hxw58/test';
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || '5000451326'; // ID администратора

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Проверка, является ли пользователь администратором
const isAdmin = (userId) => {
  return userId.toString() === ADMIN_USER_ID;
};

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    bot.sendMessage(chatId, '❌ У вас нет прав доступа к этому боту.');
    return;
  }

  const welcomeMessage = `
🤖 *Админ-бот управления базой данных Telegram Clone*

Доступные команды:
📊 /stats - Статистика базы данных
👥 /users - Список всех пользователей
🗑️ /delete [ID] - Удалить пользователя по ID
📞 /deletephone [номер] - Удалить пользователя по телефону
⚠️ /clear - Очистить всю базу данных
ℹ️ /help - Показать справку

Используйте команды для управления базой данных.
  `;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Команда /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    bot.sendMessage(chatId, '❌ У вас нет прав доступа к этому боту.');
    return;
  }

  const helpMessage = `
📚 *Справка по командам:*

📊 \`/stats\` - Показать статистику (количество пользователей, чатов, сообщений)

👥 \`/users\` - Показать список всех пользователей с их данными

🗑️ \`/delete [ID]\` - Удалить пользователя по ID
Пример: \`/delete 5\`

📞 \`/deletephone [номер]\` - Удалить пользователя по номеру телефона
Пример: \`/deletephone +79999999999\`

⚠️ \`/clear\` - Полностью очистить базу данных (ОСТОРОЖНО!)

⚠️ *Внимание:* Операции удаления необратимы!
  `;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Команда /stats
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    bot.sendMessage(chatId, '❌ У вас нет прав доступа к этому боту.');
    return;
  }

  try {
    bot.sendMessage(chatId, '📊 Загружаю статистику...');
    
    // Получаем данные из базы
    const users = await admin.getAllUsers();
    await admin.getStats();
    
    const statsMessage = `
📊 *Статистика базы данных:*

👥 Пользователей: ${users ? users.length : 0}
🟢 Онлайн: ${users ? users.filter(u => u.isOnline).length : 0}
⭐ Premium: ${users ? users.filter(u => u.isPremium).length : 0}

📅 Обновлено: ${new Date().toLocaleString('ru-RU')}
    `;

    bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, `❌ Ошибка получения статистики: ${error.message}`);
  }
});

// Команда /users
bot.onText(/\/users/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    bot.sendMessage(chatId, '❌ У вас нет прав доступа к этому боту.');
    return;
  }

  try {
    bot.sendMessage(chatId, '👥 Загружаю список пользователей...');
    
    const users = await admin.getAllUsers();
    
    if (!users || users.length === 0) {
      bot.sendMessage(chatId, '📝 База данных пуста.');
      return;
    }

    let message = '👥 *Список пользователей:*\n\n';
    
    users.forEach((user, index) => {
      message += `${index + 1}. *ID:* ${user.id}\n`;
      message += `📱 *Телефон:* ${user.phone}\n`;
      message += `👤 *Имя:* ${user.firstName} ${user.lastName || ''}\n`;
      message += `🆔 *Username:* ${user.username || 'не задан'}\n`;
      message += `${user.isOnline ? '🟢' : '🔴'} ${user.isOnline ? 'Онлайн' : 'Офлайн'}\n`;
      message += `${user.isPremium ? '⭐ Premium' : '📱 Обычный'}\n\n`;
    });

    // Telegram имеет ограничение на длину сообщения (4096 символов)
    if (message.length > 4000) {
      const chunks = message.match(/.{1,4000}/g);
      for (const chunk of chunks) {
        await bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown' });
      }
    } else {
      bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    bot.sendMessage(chatId, `❌ Ошибка получения пользователей: ${error.message}`);
  }
});

// Команда /delete [ID]
bot.onText(/\/delete (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    bot.sendMessage(chatId, '❌ У вас нет прав доступа к этому боту.');
    return;
  }

  const userIdToDelete = parseInt(match[1]);
  
  try {
    bot.sendMessage(chatId, `🗑️ Удаляю пользователя с ID ${userIdToDelete}...`);
    
    await admin.deleteUser(userIdToDelete);
    
    bot.sendMessage(chatId, `✅ Пользователь с ID ${userIdToDelete} успешно удален из базы данных.`);
  } catch (error) {
    bot.sendMessage(chatId, `❌ Ошибка удаления пользователя: ${error.message}`);
  }
});

// Команда /deletephone [номер]
bot.onText(/\/deletephone (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    bot.sendMessage(chatId, '❌ У вас нет прав доступа к этому боту.');
    return;
  }

  const phoneToDelete = match[1].trim();
  
  try {
    bot.sendMessage(chatId, `🗑️ Удаляю пользователя с номером ${phoneToDelete}...`);
    
    await admin.deleteUserByPhone(phoneToDelete);
    
    bot.sendMessage(chatId, `✅ Пользователь с номером ${phoneToDelete} успешно удален из базы данных.`);
  } catch (error) {
    bot.sendMessage(chatId, `❌ Ошибка удаления пользователя: ${error.message}`);
  }
});

// Команда /clear
bot.onText(/\/clear/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    bot.sendMessage(chatId, '❌ У вас нет прав доступа к этому боту.');
    return;
  }

  // Запрашиваем подтверждение
  const confirmMessage = `
⚠️ *ВНИМАНИЕ!* 

Вы собираетесь полностью очистить базу данных!
Это действие удалит ВСЕ данные:
- Всех пользователей
- Все чаты
- Все сообщения
- Все звонки
- Все настройки

❗ *Это действие НЕОБРАТИМО!*

Для подтверждения отправьте: \`/confirmclear\`
Для отмены: \`/cancel\`
  `;

  bot.sendMessage(chatId, confirmMessage, { parse_mode: 'Markdown' });
});

// Подтверждение очистки
bot.onText(/\/confirmclear/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    bot.sendMessage(chatId, '❌ У вас нет прав доступа к этому боту.');
    return;
  }

  try {
    bot.sendMessage(chatId, '🗑️ Очищаю базу данных...');
    
    await admin.clearDatabase();
    
    bot.sendMessage(chatId, '✅ База данных полностью очищена!');
  } catch (error) {
    bot.sendMessage(chatId, `❌ Ошибка очистки базы данных: ${error.message}`);
  }
});

// Команда /cancel
bot.onText(/\/cancel/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    bot.sendMessage(chatId, '❌ У вас нет прав доступа к этому боту.');
    return;
  }

  bot.sendMessage(chatId, '✅ Операция отменена.');
});

// Обработка неизвестных команд
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  if (!isAdmin(userId)) {
    return;
  }

  // Проверяем, начинается ли сообщение с /
  if (text && text.startsWith('/') && !text.match(/^\/(start|help|stats|users|delete|deletephone|clear|confirmclear|cancel)/)) {
    bot.sendMessage(chatId, '❓ Неизвестная команда. Используйте /help для просмотра доступных команд.');
  }
});

console.log('🤖 Telegram бот запущен и готов к работе!');
console.log('📋 Используйте /start для начала работы');

export default bot;
