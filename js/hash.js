export function hashSegments() {
  return location.hash.replace(/^#\//, '').split('/').filter(Boolean);
}
