
import { StudyLog } from './types';

export const SUBJECTS = [
  'Mathematics',
  'Science',
  'Languages',
  'History',
  'Literature',
  'Computer Science',
  'Economics',
  'Arts'
];

export const MOCK_LOGS: StudyLog[] = [
  {
    id: '1',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    subject: 'Mathematics',
    durationMinutes: 90,
    mood: 4,
    focus: 5,
    score: 85,
    timeOfDay: 'morning',
    notes: 'Calculus derivatives went well.'
  },
  {
    id: '2',
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    subject: 'Science',
    durationMinutes: 45,
    mood: 2,
    focus: 2,
    score: 60,
    timeOfDay: 'evening',
    notes: 'Very tired, struggled with organic chemistry basics.'
  },
  {
    id: '3',
    date: new Date(Date.now() - 3600000).toISOString(),
    subject: 'Languages',
    durationMinutes: 60,
    mood: 5,
    focus: 4,
    score: 92,
    timeOfDay: 'afternoon',
    notes: 'Spanish verb conjugations practice.'
  }
];
