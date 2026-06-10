/**
 * 合并同名食材的记录，累加份数和热量
 */
export interface MergedRecord {
  food_name: string;
  serving_amount: number;
  serving_unit: string;
  calorie: number;
  carb: number;
  protein: number;
  fat: number;
  recordIds: (number | string)[];
}

export function mergeDietRecords(records: { 
  food_name: string; 
  serving_amount?: number; 
  serving_unit?: string; 
  calorie?: number; 
  carb?: number; 
  protein?: number; 
  fat?: number; 
  id?: number | string;
}[]): MergedRecord[] {
  const map = new Map<string, MergedRecord>();

  for (const record of records) {
    const name = record.food_name;
    const existing = map.get(name);

    if (existing) {
      existing.serving_amount += record.serving_amount || 1;
      existing.calorie += record.calorie || 0;
      existing.carb += record.carb || 0;
      existing.protein += record.protein || 0;
      existing.fat += record.fat || 0;
      if (record.id !== undefined) {
        existing.recordIds.push(record.id);
      }
    } else {
      map.set(name, {
        food_name: name,
        serving_amount: record.serving_amount || 1,
        serving_unit: record.serving_unit || '份',
        calorie: record.calorie || 0,
        carb: record.carb || 0,
        protein: record.protein || 0,
        fat: record.fat || 0,
        recordIds: record.id !== undefined ? [record.id] : [],
      });
    }
  }

  return Array.from(map.values());
}