export const MAX_STUDENTS = 3;
export const MAX_STUDENT_INDEX = MAX_STUDENTS - 1;
export const CYCLE_CLASS_COUNT = 12;
export const MAX_NAME_LENGTH = 60;

export function defaultStudentName(index: number) {
  return `Student ${index + 1}`;
}
