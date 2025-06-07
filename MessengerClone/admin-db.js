
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { users, chats, messages, chatMembers, calls, userSettings } from './shared/schema.js';
import { eq, or } from 'drizzle-orm';

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

class DatabaseAdmin {
  // Получить всех пользователей
  async getAllUsers() {
    try {
      const allUsers = await db.select().from(users);
      console.log('\n=== ВСЕ ПОЛЬЗОВАТЕЛИ ===');
      allUsers.forEach(user => {
        console.log(`ID: ${user.id} | Телефон: ${user.phone} | Имя: ${user.firstName} ${user.lastName || ''} | Username: ${user.username || 'не задан'} | Premium: ${user.isPremium ? 'Да' : 'Нет'} | Онлайн: ${user.isOnline ? 'Да' : 'Нет'}`);
      });
      return allUsers;
    } catch (error) {
      console.error('Ошибка получения пользователей:', error);
    }
  }

  // Удалить пользователя по ID
  async deleteUser(userId) {
    try {
      console.log(`\n=== УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ ID: ${userId} ===`);
      
      // Удаляем сообщения пользователя
      await db.delete(messages).where(eq(messages.senderId, userId));
      console.log('✓ Сообщения удалены');
      
      // Удаляем членства в чатах
      await db.delete(chatMembers).where(eq(chatMembers.userId, userId));
      console.log('✓ Членства в чатах удалены');
      
      // Удаляем звонки
      await db.delete(calls).where(or(eq(calls.callerId, userId), eq(calls.receiverId, userId)));
      console.log('✓ Звонки удалены');
      
      // Удаляем настройки
      await db.delete(userSettings).where(eq(userSettings.userId, userId));
      console.log('✓ Настройки удалены');
      
      // Удаляем пользователя
      await db.delete(users).where(eq(users.id, userId));
      console.log('✓ Пользователь удален');
      
      console.log(`Пользователь с ID ${userId} полностью удален из базы данных`);
    } catch (error) {
      console.error('Ошибка удаления пользователя:', error);
    }
  }

  // Удалить пользователя по номеру телефона
  async deleteUserByPhone(phone) {
    try {
      const [user] = await db.select().from(users).where(eq(users.phone, phone));
      if (!user) {
        console.log(`Пользователь с номером ${phone} не найден`);
        return;
      }
      await this.deleteUser(user.id);
    } catch (error) {
      console.error('Ошибка удаления пользователя по телефону:', error);
    }
  }

  // Получить статистику базы данных
  async getStats() {
    try {
      const usersCount = await db.select().from(users);
      const chatsCount = await db.select().from(chats);
      const messagesCount = await db.select().from(messages);
      
      console.log('\n=== СТАТИСТИКА БАЗЫ ДАННЫХ ===');
      console.log(`Пользователей: ${usersCount.length}`);
      console.log(`Чатов: ${chatsCount.length}`);
      console.log(`Сообщений: ${messagesCount.length}`);
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
    }
  }

  // Очистить всю базу данных
  async clearDatabase() {
    try {
      console.log('\n=== ОЧИСТКА БАЗЫ ДАННЫХ ===');
      await db.delete(messages);
      console.log('✓ Сообщения удалены');
      await db.delete(chatMembers);
      console.log('✓ Члены чатов удалены');
      await db.delete(chats);
      console.log('✓ Чаты удалены');
      await db.delete(calls);
      console.log('✓ Звонки удалены');
      await db.delete(userSettings);
      console.log('✓ Настройки удалены');
      await db.delete(users);
      console.log('✓ Пользователи удалены');
      console.log('База данных очищена');
    } catch (error) {
      console.error('Ошибка очистки базы данных:', error);
    }
  }
}

// Создаем экземпляр админки
const admin = new DatabaseAdmin();

// Примеры использования:

// Показать всех пользователей
admin.getAllUsers();

// Показать статистику
admin.getStats();

// Удалить пользователя по ID (раскомментируйте для использования)
// admin.deleteUser(1);

// Удалить пользователя по номеру телефона (раскомментируйте для использования)
// admin.deleteUserByPhone('+79999999999');

// Очистить всю базу данных (ОСТОРОЖНО! раскомментируйте для использования)
// admin.clearDatabase();

export default admin;
