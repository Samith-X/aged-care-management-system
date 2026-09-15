export const makeId = (prefix, items = []) => {
  const max = items.reduce((current, item) => {
    const number = Number(String(item.id || '').replace(/\D/g, '')) || 0;
    return Math.max(current, number);
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
};

export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const normalise = (value) => String(value ?? '').toLowerCase().trim();

export const includesText = (values, query) => {
  const q = normalise(query);
  if (!q) return true;
  return values.some((value) => normalise(value).includes(q));
};
