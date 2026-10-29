export function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60]
  ];
  for (const [unit, size] of units) {
    const amount = Math.floor(seconds / size);
    if (amount >= 1) return `${amount} ${unit}${amount > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

export const hashtagsToText = (tags = []) => tags.join(' ');

// "1 photo" / "3 photos"
export const photoCount = (n) => `${n} ${n === 1 ? 'photo' : 'photos'}`;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Reads an uploaded image file into a data URL that can be stored in MongoDB
export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file'));
    if (file.size > MAX_IMAGE_BYTES) return reject(new Error('Images must be smaller than 5MB'));
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.readAsDataURL(file);
  });
}
