const JAMAICA_TIME_ZONE = 'America/Jamaica';
const JAMAICA_UTC_OFFSET_HOURS = 5;

type DateInput = string | number | Date;

const toDate = (value: DateInput) => value instanceof Date ? value : new Date(value);

const parseDateInputValue = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
};

const toDateInputValueFromUtcDate = (value: Date) => {
  const year = value.getUTCFullYear();
  const month = `${value.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${value.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatJamaicaDate = (value: DateInput, options?: Intl.DateTimeFormatOptions) => (
  new Intl.DateTimeFormat(undefined, {
    timeZone: JAMAICA_TIME_ZONE,
    ...(options ?? {}),
  }).format(toDate(value))
);

export const formatJamaicaDateTime = (value: DateInput, options?: Intl.DateTimeFormatOptions) => (
  new Intl.DateTimeFormat(undefined, {
    timeZone: JAMAICA_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...(options ?? {}),
  }).format(toDate(value))
);

export const getJamaicaDateInputValue = (value: DateInput = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: JAMAICA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(toDate(value));

  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';

  return `${year}-${month}-${day}`;
};

export const addDaysToDateInputValue = (value: string, days: number) => {
  const { year, month, day } = parseDateInputValue(value);
  return toDateInputValueFromUtcDate(new Date(Date.UTC(year, month - 1, day + days)));
};

export const getStartOfJamaicaDayIso = (value: string) => {
  const { year, month, day } = parseDateInputValue(value);
  return new Date(Date.UTC(year, month - 1, day, JAMAICA_UTC_OFFSET_HOURS, 0, 0, 0)).toISOString();
};

export const getEndOfJamaicaDayIso = (value: string) => {
  const { year, month, day } = parseDateInputValue(value);
  return new Date(Date.UTC(year, month - 1, day + 1, JAMAICA_UTC_OFFSET_HOURS - 1, 59, 59, 999)).toISOString();
};

export { JAMAICA_TIME_ZONE };