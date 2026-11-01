export const TAKEOVER_CATEGORIES = ['Finishing', 'Shooting', 'Playmaking', 'Defense', 'Rebounding', 'Physicals'];

export function formatTakeoverRequirements(requirements, attributes) {
  if (!requirements.length) return 'Available by default';
  const separator = requirements.length > 1 && requirements[0][2] === 0 ? ' or ' : ' + ';
  return requirements.map(([attribute, rating]) => `${attributes[attribute] ?? `Attribute ${attribute}`} ${rating}`).join(separator);
}
