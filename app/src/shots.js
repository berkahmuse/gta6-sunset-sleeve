// Fixed scenes for screenshots.
// ?shot=cover&size=wide|square|portrait&caption=...&subtitle=...&layout=...&grade=...
// renders ONLY the finished cover at that aspect.
// ?shot=editor shows the editor with samples loaded.
export const SIZES = { square: [1080, 1080], portrait: [1080, 1350], wide: [1920, 1080] };
export function parseShot(query) {
  return {
    shot: query.get('shot'),
    size: query.get('size') || 'square',
    caption: query.get('caption') || 'Vice Heat',
    subtitle: query.get('subtitle') || 'NEON NIGHTS · PALM CITY',
    layout: query.get('layout') || 'trio',
    grade: query.get('grade') || 'neon',
  };
}
