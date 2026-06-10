import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 9091;

// Database setup with SQLite
const dbPath = path.join(__dirname, 'diet.db');
const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT UNIQUE NOT NULL,
    username TEXT,
    daily_calorie_goal INTEGER DEFAULT 1800,
    daily_carb_goal INTEGER DEFAULT 250,
    daily_protein_goal INTEGER DEFAULT 80,
    daily_fat_goal INTEGER DEFAULT 60,
    reminder_enabled INTEGER DEFAULT 1,
    reminder_time TEXT DEFAULT '09:00:00',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS food_database (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_pinyin TEXT,
    category TEXT,
    calorie INTEGER NOT NULL,
    carb REAL DEFAULT 0,
    protein REAL DEFAULT 0,
    fat REAL DEFAULT 0,
    serving_size TEXT,
    serving_gram INTEGER DEFAULT 100,
    barcode TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 用户自定义食材表
  CREATE TABLE IF NOT EXISTS user_foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    calorie INTEGER NOT NULL,
    carb REAL DEFAULT 0,
    protein REAL DEFAULT 0,
    fat REAL DEFAULT 0,
    serving_unit TEXT DEFAULT '份',
    serving_gram INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS diet_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    food_id INTEGER,
    food_name TEXT NOT NULL,
    meal_type TEXT NOT NULL,
    calorie INTEGER NOT NULL,
    carb REAL DEFAULT 0,
    protein REAL DEFAULT 0,
    fat REAL DEFAULT 0,
    serving_amount REAL DEFAULT 1,
    serving_unit TEXT,
    record_date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS daily_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stat_date TEXT NOT NULL,
    total_calorie INTEGER DEFAULT 0,
    total_carb REAL DEFAULT 0,
    total_protein REAL DEFAULT 0,
    total_fat REAL DEFAULT 0,
    goal_achieved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, stat_date)
  );

  CREATE INDEX IF NOT EXISTS idx_diet_records_user_date ON diet_records(user_id, record_date);
  CREATE INDEX IF NOT EXISTS idx_user_foods_user ON user_foods(user_id);
`);

// Seed food database if empty
const foodCount = db.prepare('SELECT COUNT(*) as count FROM food_database').get() as { count: number };
if (foodCount.count === 0) {
  const insertFood = db.prepare(`
    INSERT INTO food_database (name, name_pinyin, category, calorie, carb, protein, fat, serving_size, serving_gram)
    VALUES (@name, @name_pinyin, @category, @calorie, @carb, @protein, @fat, @serving_size, @serving_gram)
  `);

  const foods = [
    { name: '白粥', name_pinyin: 'bai_zhou', category: 'breakfast', calorie: 46, carb: 9.9, protein: 1.1, fat: 0.2, serving_size: '碗', serving_gram: 250 },
    { name: '豆浆', name_pinyin: 'dou_jiang', category: 'breakfast', calorie: 33, carb: 1.2, protein: 2.9, fat: 1.6, serving_size: '杯', serving_gram: 250 },
    { name: '包子', name_pinyin: 'bao_zi', category: 'breakfast', calorie: 227, carb: 37.0, protein: 7.0, fat: 4.8, serving_size: '个', serving_gram: 100 },
    { name: '油条', name_pinyin: 'you_tiao', category: 'breakfast', calorie: 386, carb: 51.0, protein: 6.0, fat: 17.0, serving_size: '根', serving_gram: 50 },
    { name: '鸡蛋', name_pinyin: 'ji_dan', category: 'breakfast', calorie: 144, carb: 1.3, protein: 13.3, fat: 8.8, serving_size: '个', serving_gram: 60 },
    { name: '牛奶', name_pinyin: 'niu_nai', category: 'breakfast', calorie: 54, carb: 3.4, protein: 3.0, fat: 3.2, serving_size: '盒', serving_gram: 250 },
    { name: '米饭', name_pinyin: 'mi_fan', category: 'staple', calorie: 116, carb: 25.9, protein: 2.6, fat: 0.3, serving_size: '碗', serving_gram: 200 },
    { name: '面条', name_pinyin: 'mian_tiao', category: 'staple', calorie: 284, carb: 59.5, protein: 8.3, fat: 0.8, serving_size: '碗', serving_gram: 200 },
    { name: '馒头', name_pinyin: 'man_tou', category: 'staple', calorie: 223, carb: 47.0, protein: 7.0, fat: 1.0, serving_size: '个', serving_gram: 100 },
    { name: '西兰花', name_pinyin: 'xi_lan_hua', category: 'vegetable', calorie: 34, carb: 6.6, protein: 2.9, fat: 0.4, serving_size: '100g', serving_gram: 100 },
    { name: '菠菜', name_pinyin: 'bo_cai', category: 'vegetable', calorie: 24, carb: 4.5, protein: 2.6, fat: 0.3, serving_size: '100g', serving_gram: 100 },
    { name: '西红柿', name_pinyin: 'xi_hong_shi', category: 'vegetable', calorie: 19, carb: 3.9, protein: 0.9, fat: 0.2, serving_size: '个', serving_gram: 150 },
    { name: '黄瓜', name_pinyin: 'huang_gua', category: 'vegetable', calorie: 15, carb: 2.9, protein: 0.8, fat: 0.2, serving_size: '根', serving_gram: 200 },
    { name: '鸡胸肉', name_pinyin: 'ji_xiong_rou', category: 'meat', calorie: 133, carb: 0.0, protein: 31.0, fat: 1.2, serving_size: '100g', serving_gram: 100 },
    { name: '牛肉', name_pinyin: 'niu_rou', category: 'meat', calorie: 125, carb: 0.0, protein: 26.0, fat: 3.0, serving_size: '100g', serving_gram: 100 },
    { name: '猪肉', name_pinyin: 'zhu_rou', category: 'meat', calorie: 143, carb: 0.0, protein: 21.0, fat: 6.0, serving_size: '100g', serving_gram: 100 },
    { name: '鱼肉', name_pinyin: 'yu_rou', category: 'meat', calorie: 90, carb: 0.0, protein: 18.0, fat: 2.0, serving_size: '100g', serving_gram: 100 },
    { name: '苹果', name_pinyin: 'ping_guo', category: 'fruit', calorie: 52, carb: 13.8, protein: 0.3, fat: 0.2, serving_size: '个', serving_gram: 200 },
    { name: '香蕉', name_pinyin: 'xiang_jiao', category: 'fruit', calorie: 93, carb: 22.8, protein: 1.4, fat: 0.2, serving_size: '根', serving_gram: 120 },
    { name: '橙子', name_pinyin: 'cheng_zi', category: 'fruit', calorie: 47, carb: 11.8, protein: 0.9, fat: 0.1, serving_size: '个', serving_gram: 200 },
  ];

  const insertMany = db.transaction((foods) => {
    for (const food of foods) {
      insertFood.run(food);
    }
  });
  insertMany(foods);
  console.log('Food database seeded with', foods.length, 'items');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ============ User APIs ============

// Create or get user
app.post('/api/v1/users', (req, res) => {
  try {
    const { device_id, username } = req.body;
    
    if (!device_id) {
      return res.status(400).json({ error: 'device_id is required' });
    }

    const existingUser = db.prepare('SELECT * FROM users WHERE device_id = ?').get(device_id);
    if (existingUser) {
      return res.json(existingUser);
    }

    const result = db.prepare(`
      INSERT INTO users (device_id, username) VALUES (?, ?)
    `).run(device_id, username || '用户');

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get user profile
app.get('/api/v1/users/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile
app.put('/api/v1/users/:id', (req, res) => {
  try {
    const { username, daily_calorie_goal, daily_carb_goal, daily_protein_goal, daily_fat_goal, reminder_enabled, reminder_time } = req.body;
    
    db.prepare(`
      UPDATE users SET 
        username = COALESCE(?, username),
        daily_calorie_goal = COALESCE(?, daily_calorie_goal),
        daily_carb_goal = COALESCE(?, daily_carb_goal),
        daily_protein_goal = COALESCE(?, daily_protein_goal),
        daily_fat_goal = COALESCE(?, daily_fat_goal),
        reminder_enabled = COALESCE(?, reminder_enabled),
        reminder_time = COALESCE(?, reminder_time),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(username, daily_calorie_goal, daily_carb_goal, daily_protein_goal, daily_fat_goal, reminder_enabled, reminder_time, req.params.id);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ============ User Foods APIs (用户自定义食材) ============

// Create user food
app.post('/api/v1/user-foods', (req, res) => {
  try {
    const { user_id, name, calorie, carb, protein, fat, serving_unit, serving_gram } = req.body;

    if (!user_id || !name || calorie === undefined) {
      return res.status(400).json({ error: 'user_id, name and calorie are required' });
    }

    const result = db.prepare(`
      INSERT INTO user_foods (user_id, name, calorie, carb, protein, fat, serving_unit, serving_gram)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user_id, name, calorie, carb || 0, protein || 0, fat || 0, serving_unit || '份', serving_gram || 100);

    const food = db.prepare('SELECT * FROM user_foods WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(food);
  } catch (error) {
    console.error('Error creating user food:', error);
    res.status(500).json({ error: 'Failed to create user food' });
  }
});

// Get user foods
app.get('/api/v1/user-foods', (req, res) => {
  try {
    const { user_id, q } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    let query = 'SELECT * FROM user_foods WHERE user_id = ?';
    const params: any[] = [user_id];

    if (q) {
      query += ' AND name LIKE ?';
      params.push(`%${q}%`);
    }

    query += ' ORDER BY created_at DESC';
    const foods = db.prepare(query).all(...params);
    res.json(foods);
  } catch (error) {
    console.error('Error fetching user foods:', error);
    res.status(500).json({ error: 'Failed to fetch user foods' });
  }
});

// Update user food
app.put('/api/v1/user-foods/:id', (req, res) => {
  try {
    const { name, calorie, carb, protein, fat, serving_unit, serving_gram } = req.body;

    db.prepare(`
      UPDATE user_foods SET 
        name = COALESCE(?, name),
        calorie = COALESCE(?, calorie),
        carb = COALESCE(?, carb),
        protein = COALESCE(?, protein),
        fat = COALESCE(?, fat),
        serving_unit = COALESCE(?, serving_unit),
        serving_gram = COALESCE(?, serving_gram)
      WHERE id = ?
    `).run(name, calorie, carb, protein, fat, serving_unit, serving_gram, req.params.id);

    const food = db.prepare('SELECT * FROM user_foods WHERE id = ?').get(req.params.id);
    res.json(food);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user food' });
  }
});

// Delete user food
app.delete('/api/v1/user-foods/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM user_foods WHERE id = ?').run(req.params.id);
    res.json({ message: 'Food deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user food' });
  }
});

// ============ Public Food APIs (系统食物库) ============

// Get all foods with search
app.get('/api/v1/foods', (req, res) => {
  try {
    const { q, category, limit = 20, offset = 0 } = req.query;
    let query = 'SELECT * FROM food_database';
    const params: any[] = [];
    const conditions: string[] = [];

    if (q) {
      conditions.push('(name LIKE ? OR name_pinyin LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY name LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const foods = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM food_database').get() as { count: number };
    
    res.json({ foods, total: total.count });
  } catch (error) {
    console.error('Error fetching foods:', error);
    res.status(500).json({ error: 'Failed to fetch foods' });
  }
});

// Get food by ID
app.get('/api/v1/foods/:id', (req, res) => {
  try {
    const food = db.prepare('SELECT * FROM food_database WHERE id = ?').get(req.params.id);
    if (!food) {
      return res.status(404).json({ error: 'Food not found' });
    }
    res.json(food);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch food' });
  }
});

// ============ Diet Record APIs ============

// Add diet record
app.post('/api/v1/records', (req, res) => {
  try {
    const { user_id, food_id, food_name, meal_type, calorie, carb, protein, fat, serving_amount, serving_unit, record_date } = req.body;

    const result = db.prepare(`
      INSERT INTO diet_records (user_id, food_id, food_name, meal_type, calorie, carb, protein, fat, serving_amount, serving_unit, record_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user_id, food_id, food_name, meal_type, calorie, carb, protein, fat, serving_amount, serving_unit, record_date);

    // Update daily stats
    const existingStat = db.prepare('SELECT * FROM daily_stats WHERE user_id = ? AND stat_date = ?').get(user_id, record_date);
    if (existingStat) {
      db.prepare(`
        UPDATE daily_stats SET 
          total_calorie = total_calorie + ?,
          total_carb = total_carb + ?,
          total_protein = total_protein + ?,
          total_fat = total_fat + ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND stat_date = ?
      `).run(calorie, carb, protein, fat, user_id, record_date);
    } else {
      db.prepare(`
        INSERT INTO daily_stats (user_id, stat_date, total_calorie, total_carb, total_protein, total_fat)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(user_id, record_date, calorie, carb, protein, fat);
    }

    const record = db.prepare('SELECT * FROM diet_records WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ error: 'Failed to create record' });
  }
});

// Get diet records by date
app.get('/api/v1/records', (req, res) => {
  try {
    const { user_id, date, meal_type } = req.query;
    let query = 'SELECT * FROM diet_records WHERE user_id = ?';
    const params: any[] = [user_id];

    if (date) {
      query += ' AND record_date = ?';
      params.push(date);
    }
    if (meal_type) {
      query += ' AND meal_type = ?';
      params.push(meal_type);
    }

    query += ' ORDER BY created_at DESC';
    const records = db.prepare(query).all(...params);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// Delete diet record
app.delete('/api/v1/records/:id', (req, res) => {
  try {
    const record = db.prepare('SELECT * FROM diet_records WHERE id = ?').get(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    db.prepare('DELETE FROM diet_records WHERE id = ?').run(req.params.id);

    // Update daily stats
    const r = record as any;
    db.prepare(`
      UPDATE daily_stats SET 
        total_calorie = total_calorie - ?,
        total_carb = total_carb - ?,
        total_protein = total_protein - ?,
        total_fat = total_fat - ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND stat_date = ?
    `).run(r.calorie, r.carb, r.protein, r.fat, r.user_id, r.record_date);

    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// ============ Stats APIs ============

// Get daily stats
app.get('/api/v1/stats/daily', (req, res) => {
  try {
    const { user_id, date } = req.query;
    const stats = db.prepare(`
      SELECT ds.*, u.daily_calorie_goal, u.daily_carb_goal, u.daily_protein_goal, u.daily_fat_goal
      FROM daily_stats ds
      JOIN users u ON ds.user_id = u.id
      WHERE ds.user_id = ? AND ds.stat_date = ?
    `).get(user_id, date);
    res.json(stats || { user_id, stat_date: date, total_calorie: 0, total_carb: 0, total_protein: 0, total_fat: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch daily stats' });
  }
});

// Get stats by date range
app.get('/api/v1/stats/history', (req, res) => {
  try {
    const { user_id, start_date, end_date } = req.query;

    let sql = `
      SELECT ds.*, u.daily_calorie_goal, u.daily_carb_goal, u.daily_protein_goal, u.daily_fat_goal
      FROM daily_stats ds
      JOIN users u ON ds.user_id = u.id
      WHERE ds.user_id = ?
    `;
    const params: any[] = [user_id];

    if (start_date) {
      sql += ' AND ds.stat_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND ds.stat_date <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY ds.stat_date ASC';
    const stats = db.prepare(sql).all(...params);

    // Compute comprehensive stats summary
    const daysWithRecords = stats.length;
    const totalCalorie = (stats as any[]).reduce((s, d) => s + d.total_calorie, 0);
    const totalCarb = (stats as any[]).reduce((s, d) => s + d.total_carb, 0);
    const totalProtein = (stats as any[]).reduce((s, d) => s + d.total_protein, 0);
    const totalFat = (stats as any[]).reduce((s, d) => s + d.total_fat, 0);

    const goalCalorie = (stats as any[])[0]?.daily_calorie_goal || 1800;
    const achievedDays = (stats as any[]).filter(d => d.total_calorie <= d.daily_calorie_goal).length;
    const avgCalorie = daysWithRecords > 0 ? Math.round(totalCalorie / daysWithRecords) : 0;
    const avgCarb = daysWithRecords > 0 ? Math.round(totalCarb / daysWithRecords * 10) / 10 : 0;
    const avgProtein = daysWithRecords > 0 ? Math.round(totalProtein / daysWithRecords * 10) / 10 : 0;
    const avgFat = daysWithRecords > 0 ? Math.round(totalFat / daysWithRecords * 10) / 10 : 0;
    const totalDeficit = daysWithRecords > 0 ? Math.max(0, goalCalorie * daysWithRecords - totalCalorie) : 0;
    const achievementRate = daysWithRecords > 0 ? Math.round((achievedDays / daysWithRecords) * 100) : 0;

    res.json({
      summary: {
        daysWithRecords,
        avgCalorie,
        achievedDays,
        achievementRate,
        totalDeficit,
        avgCarb,
        avgProtein,
        avgFat,
        goalCalorie,
      },
      trend: stats,
    });
  } catch (error) {
    console.error('Error fetching stats history:', error);
    res.status(500).json({ error: 'Failed to fetch stats history' });
  }
});

// Get weekly summary
app.get('/api/v1/stats/weekly', (req, res) => {
  try {
    const { user_id } = req.query;
    const stats = db.prepare(`
      SELECT 
        strftime('%W', stat_date) as week,
        SUM(total_calorie) as total_calorie,
        SUM(total_carb) as total_carb,
        SUM(total_protein) as total_protein,
        SUM(total_fat) as total_fat,
        COUNT(*) as days_logged,
        AVG(total_calorie) as avg_calorie
      FROM daily_stats
      WHERE user_id = ? AND stat_date >= date('now', '-30 days')
      GROUP BY week
      ORDER BY week DESC
    `).all(user_id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weekly stats' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
