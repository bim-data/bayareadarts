import { Course } from '../types';

/**
 * Finds the White tee or closest equivalent (Regular, Middle, ~6,000-6,300 yds)
 * for a course, ensuring the White tee is always the default.
 */
export function findWhiteOrEquivalentTee(course?: Course): string {
  if (!course || !course.tees || course.tees.length === 0) return '';

  // 1. Exact match on 'white' in tee name or color
  const whiteTee = course.tees.find((t) => {
    const nameLower = t.name.toLowerCase();
    const colorLower = (t.color || '').toLowerCase();
    return (
      nameLower.includes('white') ||
      colorLower.includes('white') ||
      colorLower === '#ffffff' ||
      colorLower === '#e5e7eb' ||
      colorLower === '#f8fafc'
    );
  });
  if (whiteTee) return whiteTee.id;

  // 2. Match on 'regular', 'member', 'middle', 'mid'
  const regularTee = course.tees.find((t) => {
    const nameLower = t.name.toLowerCase();
    return (
      nameLower.includes('regular') ||
      nameLower.includes('member') ||
      nameLower.includes('middle') ||
      nameLower.includes('mid')
    );
  });
  if (regularTee) return regularTee.id;

  // 3. Match on yardage closest to 6,100 yards (typical White tee)
  if (course.tees.length > 2) {
    const sortedByProximity = [...course.tees].sort(
      (a, b) => Math.abs((a.totalYardage || 6100) - 6100) - Math.abs((b.totalYardage || 6100) - 6100)
    );
    if (sortedByProximity[0]) return sortedByProximity[0].id;
  }

  // 4. Default to index 1 (usually White if black/blue/white/red) or index 0
  if (course.tees.length >= 3) return course.tees[1].id;
  return course.tees[0].id;
}

/**
 * Generates standard 18 holes based on par and white yardage
 */
export function generate18Holes(totalPar: number = 72, totalYardage: number = 6200) {
  // Standard distribution: four par 3s, ten par 4s, four par 5s = par 72
  const standardPars = [4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 3, 4, 4, 5, 4, 4, 3, 5];
  const handicapIndices = [7, 3, 15, 1, 9, 5, 17, 11, 13, 10, 16, 2, 8, 4, 12, 18, 14, 6];

  const avgHoleYds = Math.round(totalYardage / 18);

  return standardPars.map((par, i) => {
    let holeYds = avgHoleYds;
    if (par === 3) holeYds = Math.round(avgHoleYds * 0.48);
    else if (par === 5) holeYds = Math.round(avgHoleYds * 1.42);
    else holeYds = Math.round(avgHoleYds * 1.05 + (i % 3) * 15);

    return {
      number: i + 1,
      par,
      yardage: holeYds,
      handicapIndex: handicapIndices[i],
    };
  });
}
