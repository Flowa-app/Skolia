export interface TeacherProfile {
  subject: string;
  classLevel: string;
  exerciseTypes: string[];
  gradingScale: string;
  severity: 'bienveillant' | 'standard' | 'exigeant';
}

export interface CorrectionParams extends TeacherProfile {
  studentText?: string;
  imageBase64?: string;
  imageMimeType?: string;
}

export interface CorrectionResult {
  grade: string;
  annotations: string;
  goodPoints: string;
  improvements: string;
  studentComment: string;
}

export interface OriginalCopy {
  text?: string;
  imageBase64?: string;
  imageMimeType?: string;
}

export interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  type?: 'text' | 'correction' | 'upload-prompt';
  correctionResult?: CorrectionResult;
  originalCopy?: OriginalCopy;
}

export type OnboardingStep =
  | 'welcome'
  | 'subject'
  | 'classLevel'
  | 'exerciseType'
  | 'gradingScale'
  | 'severity'
  | 'complete'
  | 'awaiting-copy'
  | 'correcting'
  | 'done'
  | 'editing-params';

/** Which single TeacherProfile field is being edited in isolation */
export type EditableParam = keyof TeacherProfile;

export interface DailyCallCount {
  date: string;
  count: number;
}
