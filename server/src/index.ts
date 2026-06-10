import express from "express";
import cors from "cors";
import { getSupabaseClient } from "./storage/database/supabase-client.js";

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

function getClient() {
  return getSupabaseClient();
}

// Health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ============ User APIs ============

// Create or get user
app.post('/api/v1/users', async (req, res) => {
  try {
    const { device_id, username } = req.body;
    
    if (!device_id) {
      return res.status(400).json({ error: 'device_id is required' });
    }

    const supabase = getClient();
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('device_id', device_id)
      .single();

    if (existingUser) {
      return res.json(existingUser);
    }

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ device_id, username: username || '用户' })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(newUser);
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user', detail: error.message });
  }
});

// Get user profile
app.get('/api/v1/users/:id', async (req, res) => {
  try {
    const supabase = getClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch user', detail: error.message });
  }
});

// Update user profile
app.put('/api/v1/users/:id', async (req, res) => {
  try {
    const { username, daily_calorie_goal, daily_carb_goal, daily_protein_goal, daily_fat_goal } = req.body;
    
    const supabase = getClient();
    const updates: any = {};

    if (username !== undefined) updates.username = username;
    if (daily_calorie_goal !== undefined) updates.daily_calorie_goal = daily_calorie_goal;
    if (daily_carb_goal !== undefined) updates.daily_carb_goal = daily_carb_goal;
    if (daily_protein_goal !== undefined) updates.daily_protein_goal = daily_protein_goal;
    if (daily_fat_goal !== undefined) updates.daily_fat_goal = daily_fat_goal;

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(user);
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user', detail: error.message });
  }
});

// ============ User Foods APIs ============

// Create user food
app.post('/api/v1/user-foods', async (req, res) => {
  try {
    const { user_id, name, calorie, carb, protein, fat, serving_unit, serving_amount } = req.body;

    if (!user_id || !name || calorie === undefined) {
      return res.status(400).json({ error: 'user_id, name and calorie are required' });
    }

    const supabase = getClient();
    const { data: food, error } = await supabase
      .from('user_foods')
      .insert({
        user_id,
        name,
        calorie,
        carb: carb || 0,
        protein: protein || 0,
        fat: fat || 0,
        serving_unit: serving_unit || '份',
        serving_amount: serving_amount || 100,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(food);
  } catch (error: any) {
    console.error('Error creating user food:', error);
    res.status(500).json({ error: 'Failed to create user food', detail: error.message });
  }
});

// Get user foods
app.get('/api/v1/user-foods', async (req, res) => {
  try {
    const { user_id, q } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const supabase = getClient();
    let query = supabase
      .from('user_foods')
      .select('*')
      .eq('user_id', user_id);

    if (q) {
      query = query.ilike('name', `%${q}%`);
    }

    const { data: foods, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    res.json(foods || []);
  } catch (error: any) {
    console.error('Error fetching user foods:', error);
    res.status(500).json({ error: 'Failed to fetch user foods', detail: error.message });
  }
});

// Update user food
app.put('/api/v1/user-foods/:id', async (req, res) => {
  try {
    const { name, calorie, carb, protein, fat, serving_unit, serving_amount } = req.body;

    const supabase = getClient();
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (calorie !== undefined) updates.calorie = calorie;
    if (carb !== undefined) updates.carb = carb;
    if (protein !== undefined) updates.protein = protein;
    if (fat !== undefined) updates.fat = fat;
    if (serving_unit !== undefined) updates.serving_unit = serving_unit;
    if (serving_amount !== undefined) updates.serving_amount = serving_amount;

    const { data: food, error } = await supabase
      .from('user_foods')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(food);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user food', detail: error.message });
  }
});

// Delete user food
app.delete('/api/v1/user-foods/:id', async (req, res) => {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .from('user_foods')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Food deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete user food', detail: error.message });
  }
});

// ============ Public Food APIs ============

// Get all foods with search
app.get('/api/v1/foods', async (req, res) => {
  try {
    const { q, category, limit = 20, offset = 0 } = req.query;

    const supabase = getClient();
    let query = supabase
      .from('food_database')
      .select('*', { count: 'exact' });

    if (q) {
      query = query.or(`name.ilike.%${q}%`);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const { data: foods, error, count } = await query
      .order('name', { ascending: true })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) throw error;
    res.json({ foods: foods || [], total: count || 0 });
  } catch (error: any) {
    console.error('Error fetching foods:', error);
    res.status(500).json({ error: 'Failed to fetch foods', detail: error.message });
  }
});

// Get food by ID
app.get('/api/v1/foods/:id', async (req, res) => {
  try {
    const supabase = getClient();
    const { data: food, error } = await supabase
      .from('food_database')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !food) {
      return res.status(404).json({ error: 'Food not found' });
    }
    res.json(food);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch food', detail: error.message });
  }
});

// ============ Diet Record APIs ============

// Add diet record
app.post('/api/v1/records', async (req, res) => {
  try {
    const { user_id, food_name, meal_type, calorie, carb, protein, fat, serving_amount, serving_unit, record_date } = req.body;

    const supabase = getClient();

    // Insert record
    const { data: record, error: insertError } = await supabase
      .from('diet_records')
      .insert({
        user_id,
        food_name,
        meal_type,
        calorie,
        carb: carb || 0,
        protein: protein || 0,
        fat: fat || 0,
        serving_amount: serving_amount || 1,
        serving_unit: serving_unit || '份',
        record_date,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update daily stats - try to get existing
    const { data: existingStat } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', user_id)
      .eq('stat_date', record_date)
      .single();

    if (existingStat) {
      const { error: updateError } = await supabase
        .from('daily_stats')
        .update({
          total_calorie: (existingStat.total_calorie || 0) + (calorie || 0),
          total_carb: (existingStat.total_carb || 0) + (carb || 0),
          total_protein: (existingStat.total_protein || 0) + (protein || 0),
          total_fat: (existingStat.total_fat || 0) + (fat || 0),
        })
        .eq('id', existingStat.id);

      if (updateError) throw updateError;
    } else {
      const { error: createError } = await supabase
        .from('daily_stats')
        .insert({
          user_id,
          stat_date: record_date,
          total_calorie: calorie || 0,
          total_carb: carb || 0,
          total_protein: protein || 0,
          total_fat: fat || 0,
        });

      if (createError) throw createError;
    }

    res.status(201).json(record);
  } catch (error: any) {
    console.error('Error creating record:', error);
    res.status(500).json({ error: 'Failed to create record', detail: error.message });
  }
});

// Get diet records by date
app.get('/api/v1/records', async (req, res) => {
  try {
    const { user_id, date, meal_type } = req.query;

    const supabase = getClient();
    let query = supabase
      .from('diet_records')
      .select('*')
      .eq('user_id', user_id);

    if (date) {
      query = query.eq('record_date', date);
    }
    if (meal_type) {
      query = query.eq('meal_type', meal_type);
    }

    const { data: records, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    res.json(records || []);
  } catch (error: any) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: 'Failed to fetch records', detail: error.message });
  }
});

// Delete diet record by food_name and date (batch delete for merged items)
app.post('/api/v1/records/batch-delete', async (req, res) => {
  try {
    const { user_id, food_name, record_date } = req.body;

    if (!user_id || !food_name || !record_date) {
      return res.status(400).json({ error: 'user_id, food_name and record_date are required' });
    }

    const supabase = getClient();

    // Get records to be deleted to update daily stats
    const { data: recordsToDelete } = await supabase
      .from('diet_records')
      .select('*')
      .eq('user_id', user_id)
      .eq('food_name', food_name)
      .eq('record_date', record_date);

    if (!recordsToDelete || recordsToDelete.length === 0) {
      return res.status(404).json({ error: 'Records not found' });
    }

    // Calculate totals to subtract
    const totalCalorie = recordsToDelete.reduce((s: number, r: any) => s + (r.calorie || 0), 0);
    const totalCarb = recordsToDelete.reduce((s: number, r: any) => s + (r.carb || 0), 0);
    const totalProtein = recordsToDelete.reduce((s: number, r: any) => s + (r.protein || 0), 0);
    const totalFat = recordsToDelete.reduce((s: number, r: any) => s + (r.fat || 0), 0);

    // Delete records
    const { error: deleteError } = await supabase
      .from('diet_records')
      .delete()
      .eq('user_id', user_id)
      .eq('food_name', food_name)
      .eq('record_date', record_date);

    if (deleteError) throw deleteError;

    // Update daily stats
    const { data: existingStat } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', user_id)
      .eq('stat_date', record_date)
      .single();

    if (existingStat) {
      const updatedCalorie = Math.max(0, (existingStat.total_calorie || 0) - totalCalorie);
      const updatedCarb = Math.max(0, (existingStat.total_carb || 0) - totalCarb);
      const updatedProtein = Math.max(0, (existingStat.total_protein || 0) - totalProtein);
      const updatedFat = Math.max(0, (existingStat.total_fat || 0) - totalFat);

      if (updatedCalorie === 0 && updatedCarb === 0 && updatedProtein === 0 && updatedFat === 0) {
        // Delete the daily_stats row if all nutrition is zero
        await supabase.from('daily_stats').delete().eq('id', existingStat.id);
      } else {
        await supabase
          .from('daily_stats')
          .update({
            total_calorie: updatedCalorie,
            total_carb: updatedCarb,
            total_protein: updatedProtein,
            total_fat: updatedFat,
          })
          .eq('id', existingStat.id);
      }
    }

    res.json({ message: `${recordsToDelete.length} record(s) deleted successfully` });
  } catch (error: any) {
    console.error('Error batch deleting records:', error);
    res.status(500).json({ error: 'Failed to delete records', detail: error.message });
  }
});

// Delete single diet record
app.delete('/api/v1/records/:id', async (req, res) => {
  try {
    const supabase = getClient();

    // Get record first
    const { data: record, error: fetchError } = await supabase
      .from('diet_records')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Delete record
    const { error: deleteError } = await supabase
      .from('diet_records')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;

    // Update daily stats
    const { data: existingStat } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', record.user_id)
      .eq('stat_date', record.record_date)
      .single();

    if (existingStat) {
      const updatedCalorie = Math.max(0, (existingStat.total_calorie || 0) - (record.calorie || 0));
      const updatedCarb = Math.max(0, (existingStat.total_carb || 0) - (record.carb || 0));
      const updatedProtein = Math.max(0, (existingStat.total_protein || 0) - (record.protein || 0));
      const updatedFat = Math.max(0, (existingStat.total_fat || 0) - (record.fat || 0));

      if (updatedCalorie === 0 && updatedCarb === 0 && updatedProtein === 0 && updatedFat === 0) {
        await supabase.from('daily_stats').delete().eq('id', existingStat.id);
      } else {
        await supabase
          .from('daily_stats')
          .update({
            total_calorie: updatedCalorie,
            total_carb: updatedCarb,
            total_protein: updatedProtein,
            total_fat: updatedFat,
          })
          .eq('id', existingStat.id);
      }
    }

    res.json({ message: 'Record deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting record:', error);
    res.status(500).json({ error: 'Failed to delete record', detail: error.message });
  }
});

// ============ Stats APIs ============

// Get daily stats
app.get('/api/v1/stats/daily', async (req, res) => {
  try {
    const { user_id, date } = req.query;

    const supabase = getClient();

    const { data: stats } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', user_id)
      .eq('stat_date', date)
      .single();

    // Get user for goals
    const { data: user } = await supabase
      .from('users')
      .select('daily_calorie_goal, daily_carb_goal, daily_protein_goal, daily_fat_goal')
      .eq('id', user_id)
      .single();

    res.json(stats || {
      user_id: Number(user_id),
      stat_date: date,
      total_calorie: 0,
      total_carb: 0,
      total_protein: 0,
      total_fat: 0,
      ...user,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch daily stats', detail: error.message });
  }
});

// Get stats by date range
app.get('/api/v1/stats/history', async (req, res) => {
  try {
    const { user_id, start_date, end_date } = req.query;

    const supabase = getClient();

    let query = supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', user_id);

    if (start_date) {
      query = query.gte('stat_date', start_date);
    }
    if (end_date) {
      query = query.lte('stat_date', end_date);
    }

    const { data: stats, error } = await query.order('stat_date', { ascending: true });

    if (error) throw error;

    // Get user goals
    const { data: user } = await supabase
      .from('users')
      .select('daily_calorie_goal, daily_carb_goal, daily_protein_goal, daily_fat_goal')
      .eq('id', user_id)
      .single();

    const goalCalorie = user?.daily_calorie_goal || 1800;
    const goalCarb = user?.daily_carb_goal || 150;
    const goalProtein = user?.daily_protein_goal || 60;
    const goalFat = user?.daily_fat_goal || 50;

    const rows = stats || [];
    const daysWithRecords = rows.length;
    const totalCalorie = rows.reduce((s: number, d: any) => s + (d.total_calorie || 0), 0);
    const totalCarb = rows.reduce((s: number, d: any) => s + (d.total_carb || 0), 0);
    const totalProtein = rows.reduce((s: number, d: any) => s + (d.total_protein || 0), 0);
    const totalFat = rows.reduce((s: number, d: any) => s + (d.total_fat || 0), 0);

    const achievedDays = rows.filter((d: any) => (d.total_calorie || 0) <= goalCalorie).length;
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
      trend: rows.map((d: any) => ({
        ...d,
        daily_calorie_goal: goalCalorie,
        daily_carb_goal: goalCarb,
        daily_protein_goal: goalProtein,
        daily_fat_goal: goalFat,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching stats history:', error);
    res.status(500).json({ error: 'Failed to fetch stats history', detail: error.message });
  }
});

// ============ All-time stats ============
app.get('/api/v1/stats/all-time', async (req, res) => {
  try {
    const { user_id } = req.query;

    const supabase = getClient();

    // Get user goals
    const { data: user } = await supabase
      .from('users')
      .select('daily_calorie_goal')
      .eq('id', user_id)
      .single();

    const goalCalorie = user?.daily_calorie_goal || 1800;

    // Get all daily stats
    const { data: stats, error: statsError } = await supabase
      .from('daily_stats')
      .select('total_calorie, stat_date')
      .eq('user_id', user_id)
      .order('stat_date', { ascending: true });

    if (statsError) throw statsError;

    const rows = stats || [];
    const totalRecordedDays = rows.length;
    const totalCalorie = rows.reduce((s: number, d: any) => s + (d.total_calorie || 0), 0);
    const totalAchievedDays = rows.filter((d: any) => (d.total_calorie || 0) <= goalCalorie).length;

    // Calculate total deficit: sum of (goal - actual) for days under goal
    const totalDeficit = rows.reduce((s: number, d: any) => {
      const cal = d.total_calorie || 0;
      return s + (cal < goalCalorie ? Math.max(0, goalCalorie - cal) : 0);
    }, 0);

    // Calculate overage: sum of (actual - goal) for days over goal
    const totalOverage = rows.reduce((s: number, d: any) => {
      const cal = d.total_calorie || 0;
      return s + (cal > goalCalorie ? cal - goalCalorie : 0);
    }, 0);

    // Get top foods from diet_records
    const { data: foods } = await supabase
      .from('diet_records')
      .select('food_name')
      .eq('user_id', user_id);

    const foodCounts: Record<string, number> = {};
    (foods || []).forEach((f: any) => {
      foodCounts[f.food_name] = (foodCounts[f.food_name] || 0) + 1;
    });
    const topFood = Object.entries(foodCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    // Days since first record
    const firstDate = rows.length > 0 ? rows[0].stat_date : null;
    const lastDate = rows.length > 0 ? rows[rows.length - 1].stat_date : null;
    let totalDaysSinceFirst = 0;
    if (firstDate) {
      const start = new Date(firstDate);
      const end = new Date();
      totalDaysSinceFirst = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    }

    const avgCalorie = totalRecordedDays > 0 ? Math.round(totalCalorie / totalRecordedDays) : 0;
    const achievementRate = totalRecordedDays > 0 ? Math.round((totalAchievedDays / totalRecordedDays) * 100) : 0;

    res.json({
      totalRecordedDays,
      totalCalorieConsumed: Math.round(totalCalorie),
      totalDeficit: Math.round(totalDeficit),
      totalOverage: Math.round(totalOverage),
      avgCaloriePerDay: avgCalorie,
      achievementRate,
      totalAchievedDays,
      topFood,
      firstRecordDate: firstDate,
      lastRecordDate: lastDate,
      totalDaysSinceFirst,
      dailyGoal: goalCalorie,
    });
  } catch (error: any) {
    console.error('Error fetching all-time stats:', error);
    res.status(500).json({ error: 'Failed to fetch all-time stats', detail: error.message });
  }
});

// ============ Seed food database ============

async function seedFoods() {
  try {
    const supabase = getClient();
    const { count } = await supabase
      .from('food_database')
      .select('*', { count: 'exact', head: true });

    if (count && count > 0) return;

    const foods = [
      { name: '白粥', category: 'breakfast', calorie: 46, carb: 9.9, protein: 1.1, fat: 0.2, serving_amount: 250, serving_unit: '碗' },
      { name: '豆浆', category: 'breakfast', calorie: 33, carb: 1.2, protein: 2.9, fat: 1.6, serving_amount: 250, serving_unit: '杯' },
      { name: '包子', category: 'breakfast', calorie: 227, carb: 37.0, protein: 7.0, fat: 4.8, serving_amount: 100, serving_unit: '个' },
      { name: '油条', category: 'breakfast', calorie: 386, carb: 51.0, protein: 6.0, fat: 17.0, serving_amount: 50, serving_unit: '根' },
      { name: '鸡蛋', category: 'breakfast', calorie: 144, carb: 1.3, protein: 13.3, fat: 8.8, serving_amount: 60, serving_unit: '个' },
      { name: '牛奶', category: 'breakfast', calorie: 54, carb: 3.4, protein: 3.0, fat: 3.2, serving_amount: 250, serving_unit: '盒' },
      { name: '米饭', category: 'staple', calorie: 116, carb: 25.9, protein: 2.6, fat: 0.3, serving_amount: 200, serving_unit: '碗' },
      { name: '面条', category: 'staple', calorie: 284, carb: 59.5, protein: 8.3, fat: 0.8, serving_amount: 200, serving_unit: '碗' },
      { name: '馒头', category: 'staple', calorie: 223, carb: 47.0, protein: 7.0, fat: 1.0, serving_amount: 100, serving_unit: '个' },
      { name: '西兰花', category: 'vegetable', calorie: 34, carb: 6.6, protein: 2.9, fat: 0.4, serving_amount: 100, serving_unit: '100g' },
      { name: '菠菜', category: 'vegetable', calorie: 24, carb: 4.5, protein: 2.6, fat: 0.3, serving_amount: 100, serving_unit: '100g' },
      { name: '西红柿', category: 'vegetable', calorie: 19, carb: 3.9, protein: 0.9, fat: 0.2, serving_amount: 150, serving_unit: '个' },
      { name: '黄瓜', category: 'vegetable', calorie: 15, carb: 2.9, protein: 0.8, fat: 0.2, serving_amount: 200, serving_unit: '根' },
      { name: '鸡胸肉', category: 'meat', calorie: 133, carb: 0.0, protein: 31.0, fat: 1.2, serving_amount: 100, serving_unit: '100g' },
      { name: '牛肉', category: 'meat', calorie: 125, carb: 0.0, protein: 26.0, fat: 3.0, serving_amount: 100, serving_unit: '100g' },
      { name: '猪肉', category: 'meat', calorie: 143, carb: 0.0, protein: 21.0, fat: 6.0, serving_amount: 100, serving_unit: '100g' },
      { name: '鱼肉', category: 'meat', calorie: 90, carb: 0.0, protein: 18.0, fat: 2.0, serving_amount: 100, serving_unit: '100g' },
      { name: '苹果', category: 'fruit', calorie: 52, carb: 13.8, protein: 0.3, fat: 0.2, serving_amount: 200, serving_unit: '个' },
      { name: '香蕉', category: 'fruit', calorie: 93, carb: 22.8, protein: 1.4, fat: 0.2, serving_amount: 120, serving_unit: '根' },
      { name: '橙子', category: 'fruit', calorie: 47, carb: 11.8, protein: 0.9, fat: 0.1, serving_amount: 200, serving_unit: '个' },
    ];

    const { error } = await supabase.from('food_database').insert(foods);
    if (error) throw error;
    console.log('Food database seeded with', foods.length, 'items');
  } catch (error: any) {
    console.error('Error seeding foods:', error);
  }
}

app.listen(port, async () => {
  console.log(`Server listening at http://localhost:${port}/`);
  await seedFoods();
});