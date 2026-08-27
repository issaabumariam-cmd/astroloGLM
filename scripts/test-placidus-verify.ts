// Honest Placidus validation — checks VERIFIABLE properties only.
// Run: npx tsx scripts/test-placidus-verify.ts
//
// We do NOT compare against fabricated "expected cusp degrees" (those were
// wrong in earlier tests). We check:
//   1. ASC sign matches documented rising signs (high-confidence external)
//   2. Internal symmetry: H1+180=H7, H4+180=H10, H2+180=H8, etc.
//   3. Cusps are monotonically increasing (mod 360) starting from H1
//   4. Sun house is sane for the birth hour (noon → 9th/10th/11th; night → 1st-3rd)
import { DateTime } from 'luxon';
import { calculateNatalChart } from '../src/lib/astrology/placidus';

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

const tests = [
  { name: 'Obama', date: '1961-08-04', time: '19:24', lat: 21.3, lng: -157.86, tz: 'Pacific/Honolulu',
    expAsc: 'Aquarius', birthHourLocal: 19, sunExpectedHouse: [4,5,6] }, // evening, sun below horizon west
  { name: 'Taylor Swift', date: '1989-12-13', time: '05:17', lat: 40.34, lng: -75.93, tz: 'America/New_York',
    expAsc: 'Scorpio', birthHourLocal: 5, sunExpectedHouse: [1,2,3] }, // pre-dawn, sun below horizon
  { name: 'Princess Diana', date: '1961-07-01', time: '18:45', lat: 52.83, lng: 0.5, tz: 'Europe/London',
    expAsc: 'Sagittarius', birthHourLocal: 18, sunExpectedHouse: [5,6,7] }, // evening, sun near setting
  { name: 'Einstein', date: '1879-03-14', time: '11:30', lat: 48.4, lng: 9.98, tz: 'Europe/Berlin',
    expAsc: 'Cancer', birthHourLocal: 11, sunExpectedHouse: [9,10,11] }, // late morning, sun near MC
  { name: 'Amman noon', date: '1990-01-15', time: '12:00', lat: 31.96, lng: 35.91, tz: 'Asia/Amman',
    expAsc: null, birthHourLocal: 12, sunExpectedHouse: [9,10,11] },
];

async function main() {
  console.log('=== Placidus internal-consistency + ASC-sign verification ===\n');
  let ascPass = 0, symPass = 0, monoPass = 0, sunPass = 0;
  const results = [];

  for (const tc of tests) {
    const parts = tc.date.split('-').map(Number);
    const tp = tc.time.split(':').map(Number);
    const dt = DateTime.fromObject({year:parts[0],month:parts[1],day:parts[2],hour:tp[0],minute:tp[1]},{zone:tc.tz});
    const utc = dt.toUTC().toJSDate();
    const chart = await calculateNatalChart(utc, tc.lat, tc.lng, tc.name, tc.time);
    if (!chart) { console.log(`${tc.name}: calc returned null`); continue; }

    const ascDeg = chart.rising.longitude;
    const ascSign = chart.rising.signName;
    const ascOk = tc.expAsc ? (ascSign === tc.expAsc) : null;
    if (ascOk === true) ascPass++;

    // Symmetry checks
    const h: Record<number, number> = {};
    chart.houses.forEach(x => h[x.num] = x.cusp);
    const symChecks = [
      Math.abs(((h[1]+180)%360) - h[7]) < 0.01,
      Math.abs(((h[4]+180)%360) - h[10]) < 0.01,
      Math.abs(((h[2]+180)%360) - h[8]) < 0.01,
      Math.abs(((h[3]+180)%360) - h[9]) < 0.01,
      Math.abs(((h[5]+180)%360) - h[11]) < 0.01,
      Math.abs(((h[6]+180)%360) - h[12]) < 0.01,
    ];
    const symOk = symChecks.every(Boolean);
    if (symOk) symPass++;

    // Monotonic from H1 (each cusp should advance, with H13 wrapping to H1)
    let mono = true;
    let prev = h[1];
    for (let i = 2; i <= 12; i++) {
      const diff = ((h[i] - prev + 360) % 360);
      if (diff < 5 || diff > 80) mono = false; // each house 15-30° typically
      prev = h[i];
    }
    const wrapDiff = ((h[1] - h[12] + 360) % 360);
    if (wrapDiff < 5 || wrapDiff > 80) mono = false;
    if (mono) monoPass++;

    // Sun house sanity
    const sun = chart.planets.find(p => p.id === 'sun');
    const sunHouse = sun?.house ?? 0;
    const sunOk = tc.sunExpectedHouse.includes(sunHouse);
    if (sunOk) sunPass++;

    console.log(`${tc.name.padEnd(14)} ASC=${ascDeg.toFixed(2)}° ${ascSign.padEnd(12)} ${ascOk===true?'✓':ascOk===false?'✗ SIGN WRONG':'(no ref)'}  sym=${symOk?'✓':'✗'}  mono=${mono?'✓':'✗'}  Sun in H${sunHouse} ${sunOk?'✓':'✗ (exp '+tc.sunExpectedHouse.join('/')+')'}`);
    results.push({ tc, h, ascDeg, ascSign, sunHouse, ascOk, symOk, mono, sunOk });
  }

  const n = tests.length;
  console.log(`\n=== Summary ===`);
  console.log(`ASC sign matches documented: ${ascPass}/${tests.filter(t=>t.expAsc).length}`);
  console.log(`Symmetry H+n=H(n+6): ${symPass}/${n}`);
  console.log(`Monotonic cusps: ${monoPass}/${n}`);
  console.log(`Sun house sane for birth hour: ${sunPass}/${n}`);

  const allPass = (ascPass === tests.filter(t=>t.expAsc).length) && symPass === n && monoPass === n && sunPass === n;
  console.log(`\n${allPass ? '✅ ALL CHECKS PASS' : '❌ FAILURES — see above'}`);
}
main().catch(e => { console.error(e); process.exit(1); });