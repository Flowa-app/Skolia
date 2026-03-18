import { TeacherProfile, DailyCallCount } from './types';

const PROFILE_KEY = 'skolia_teacher_profile';
const DAILY_CALLS_KEY = 'skolia_daily_calls';

export function saveProfile(profile: TeacherProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadProfile(): TeacherProfile | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(PROFILE_KEY);
  if (!stored) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = JSON.parse(stored) as any;
    // Migrate old single-string exerciseType → exerciseTypes array
    if (typeof raw.exerciseType === 'string' && !raw.exerciseTypes) {
      raw.exerciseTypes = [raw.exerciseType];
      delete raw.exerciseType;
    }
    if (!Array.isArray(raw.exerciseTypes)) return null;
    return raw as TeacherProfile;
  } catch {
    return null;
  }
}

export function clearProfile(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PROFILE_KEY);
}

export function getDailyCallCount(): number {
  if (typeof window === 'undefined') return 0;
  const stored = localStorage.getItem(DAILY_CALLS_KEY);
  if (!stored) return 0;
  try {
    const data: DailyCallCount = JSON.parse(stored);
    const today = new Date().toISOString().split('T')[0];
    if (data.date !== today) return 0;
    return data.count;
  } catch {
    return 0;
  }
}

export function incrementDailyCallCount(): void {
  if (typeof window === 'undefined') return;
  const today = new Date().toISOString().split('T')[0];
  const count = getDailyCallCount();
  const data: DailyCallCount = { date: today, count: count + 1 };
  localStorage.setItem(DAILY_CALLS_KEY, JSON.stringify(data));
}
