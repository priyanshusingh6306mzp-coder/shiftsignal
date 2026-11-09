// frontend/src/utils/formatters.js

export function humanizeText(text) {
  if (!text) return '-';
  const clean = text.replace(/_/g, ' ').toLowerCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (mIdx >= 0 && mIdx < 12) {
      return `${day} ${months[mIdx]}`;
    }
  }
  return dateStr;
}
