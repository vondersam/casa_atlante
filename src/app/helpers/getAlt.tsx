export default function getAlt(filename: string) {
  /**
   * Format filename into alt text
   * /gallery/view-from-living-room.jpg -> 'View from living room'
   * @param filename A filename string with dashes
   */
  const regex = /\/([a-zA-Z0-9-]*)\.jpg/;
  const match = filename.match(regex);
  if (match) {
    const description = match[1].replaceAll('-', ' ');
    return description.charAt(0).toUpperCase() + description.slice(1);
  }
  return '';
}
