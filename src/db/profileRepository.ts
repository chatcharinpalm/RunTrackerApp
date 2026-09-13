import { getDb } from './database';
import type { Profile } from '../types';

const DEFAULT_WEIGHT_KG = 65;

export async function getProfile(): Promise<Profile> {
  const db = await getDb();
  const row = await db.getFirstAsync<Profile>('SELECT * FROM profile WHERE id = 1');
  if (row) return row;

  const created: Profile = {
    id: 1,
    weight_kg: DEFAULT_WEIGHT_KG,
    display_name: null,
    user_id: null,
    updated_at: Date.now(),
  };
  await db.runAsync(
    'INSERT INTO profile (id, weight_kg, display_name, user_id, updated_at) VALUES (1, ?, ?, ?, ?)',
    created.weight_kg,
    created.display_name,
    created.user_id,
    created.updated_at
  );
  return created;
}

export async function setWeightKg(weightKg: number): Promise<void> {
  const db = await getDb();
  await getProfile(); // ensure row exists
  await db.runAsync(
    'UPDATE profile SET weight_kg = ?, updated_at = ? WHERE id = 1',
    weightKg,
    Date.now()
  );
}

export async function setLinkedUser(userId: string | null, displayName: string | null): Promise<void> {
  const db = await getDb();
  await getProfile();
  await db.runAsync(
    'UPDATE profile SET user_id = ?, display_name = ?, updated_at = ? WHERE id = 1',
    userId,
    displayName,
    Date.now()
  );
}
