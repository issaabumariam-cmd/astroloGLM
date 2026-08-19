// Debug Placidus house cusps by comparing with Cafe Astrology report
const eps = 23.4393;
const oblRad = eps * Math.PI / 180;
const lat = 31.9539;
const latRad = lat * Math.PI / 180;

// Cafe Astrology values (from user's report)
const cafeCusps = {
  H1: 262.10,  // Sag 22°06'
  H2: 295.63,  // Cap 25°38'
  H3: 332.58,  // Pisces 2°35'
  H4: 7.35,    // Aries 7°21'
  H5: 36.22,   // Taurus 6°13'
  H6: 60.18,   // Gemini 0°11'
  H7: 82.10,   // Gemini 22°06'
  H8: 115.63,  // Cancer 25°38'
  H9: 152.58,  // Virgo 2°35'
  H10: 187.35, // Libra 7°21'
  H11: 216.22, // Scorpio 6°13'
  H12: 240.18, // Sag 0°11'
};

// Convert ecliptic longitude to RA
function longToRA(lambda) {
  const lamRad = lambda * Math.PI / 180;
  const raRad = Math.atan2(Math.sin(lamRad) * Math.cos(oblRad), Math.cos(lamRad));
  return ((raRad * 180 / Math.PI) % 360 + 360) % 360;
}

// Convert RA to ecliptic longitude
function raToLong(ra) {
  const raRad = ra * Math.PI / 180;
  const longRad = Math.atan2(Math.sin(raRad) / Math.cos(oblRad), Math.cos(raRad));
  return ((longRad * 180 / Math.PI) % 360 + 360) % 360;
}

// Declination from ecliptic longitude
function declination(lambda) {
  const lamRad = lambda * Math.PI / 180;
  return Math.asin(Math.sin(lamRad) * Math.sin(oblRad)) * 180 / Math.PI;
}

// Semi-arc (half the diurnal arc, from horizon to meridian)
function semiArc(decDeg) {
  const decRad = decDeg * Math.PI / 180;
  let cosSA = -Math.tan(latRad) * Math.tan(decRad);
  cosSA = Math.max(-1, Math.min(1, cosSA));
  return Math.acos(cosSA) * 180 / Math.PI;
}

// From the Cafe Astrology report:
// RAMC = RA of MC = RA of Libra 7°21'
const mcLong = 187.35;
const ramc = longToRA(mcLong);
const ascLong = 262.10;
const raAsc = longToRA(ascLong);

console.log('=== REFERENCE VALUES ===');
console.log('MC ecliptic:', mcLong.toFixed(2), '→ RA:', ramc.toFixed(2));
console.log('ASC ecliptic:', ascLong.toFixed(2), '→ RA:', raAsc.toFixed(2));
console.log('IC RA:', ((ramc + 180) % 360).toFixed(2));
console.log('DESC RA:', ((raAsc + 180) % 360).toFixed(2));
console.log('');

// Now let's check: what should the RA of each house cusp be?
console.log('=== HOUSE CUSP RA ANALYSIS ===');
for (const [house, long] of Object.entries(cafeCusps)) {
  const ra = longToRA(long);
  const dec = declination(long);
  const sa = semiArc(dec);
  console.log(
    house + ': long=' + long.toFixed(2).padStart(7) +
    ' RA=' + ra.toFixed(2).padStart(7) +
    ' dec=' + dec.toFixed(2).padStart(7) +
    ' SA=' + sa.toFixed(2).padStart(7)
  );
}

console.log('');

// Now let's verify the Placidus formula for each house:
// H11 (1/3 from MC toward DESC): RA = RAMC - (1/3) * SA
// H12 (2/3 from MC toward DESC): RA = RAMC - (2/3) * SA
// H2 (1/3 from ASC toward IC): RA = RA_asc + (1/3) * SA_nocturnal
// H3 (2/3 from ASC toward IC): RA = RA_asc + (2/3) * SA_nocturnal
// H5 (1/3 from IC toward DESC): RA = RA_ic + (1/3) * SA_nocturnal
// H6 (2/3 from IC toward DESC): RA = RA_ic + (2/3) * SA_nocturnal

console.log('=== VERIFYING PLACIDUS FORMULA ===');

// H11: 1/3 from MC toward DESC
{
  const dec11 = declination(cafeCusps.H11);
  const sa11 = semiArc(dec11);
  const expectedRA = ramc - (1/3) * sa11;
  const actualRA = longToRA(cafeCusps.H11);
  console.log('H11: SA=' + sa11.toFixed(2) + ' expected RA=' + (((expectedRA % 360) + 360) % 360).toFixed(2) + ' actual RA=' + actualRA.toFixed(2));
}

// H12: 2/3 from MC toward DESC
{
  const dec12 = declination(cafeCusps.H12);
  const sa12 = semiArc(dec12);
  const expectedRA = ramc - (2/3) * sa12;
  const actualRA = longToRA(cafeCusps.H12);
  console.log('H12: SA=' + sa12.toFixed(2) + ' expected RA=' + (((expectedRA % 360) + 360) % 360).toFixed(2) + ' actual RA=' + actualRA.toFixed(2));
}

// H2: 1/3 from ASC toward IC
{
  const dec2 = declination(cafeCusps.H2);
  const sa2 = semiArc(dec2);
  const expectedRA = raAsc + (1/3) * sa2;
  const actualRA = longToRA(cafeCusps.H2);
  console.log('H2:  SA=' + sa2.toFixed(2) + ' expected RA=' + (((expectedRA % 360) + 360) % 360).toFixed(2) + ' actual RA=' + actualRA.toFixed(2));
}

// H3: 2/3 from ASC toward IC
{
  const dec3 = declination(cafeCusps.H3);
  const sa3 = semiArc(dec3);
  const expectedRA = raAsc + (2/3) * sa3;
  const actualRA = longToRA(cafeCusps.H3);
  console.log('H3:  SA=' + sa3.toFixed(2) + ' expected RA=' + (((expectedRA % 360) + 360) % 360).toFixed(2) + ' actual RA=' + actualRA.toFixed(2));
}

// H5: 1/3 from IC toward DESC
{
  const dec5 = declination(cafeCusps.H5);
  const sa5 = semiArc(dec5);
  const raIc = (ramc + 180) % 360;
  const expectedRA = raIc + (1/3) * sa5;
  const actualRA = longToRA(cafeCusps.H5);
  console.log('H5:  SA=' + sa5.toFixed(2) + ' expected RA=' + (((expectedRA % 360) + 360) % 360).toFixed(2) + ' actual RA=' + actualRA.toFixed(2));
}

// H6: 2/3 from IC toward DESC
{
  const dec6 = declination(cafeCusps.H6);
  const sa6 = semiArc(dec6);
  const raIc = (ramc + 180) % 360;
  const expectedRA = raIc + (2/3) * sa6;
  const actualRA = longToRA(cafeCusps.H6);
  console.log('H6:  SA=' + sa6.toFixed(2) + ' expected RA=' + (((expectedRA % 360) + 360) % 360).toFixed(2) + ' actual RA=' + actualRA.toFixed(2));
}