const e = require('ephemeris');
const { DateTime } = require('luxon');

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

function getRAMC(lng, lat, date) {
  const r = e.getAllPlanets(date, lng, lat, 0);
  const constant = require('../node_modules/ephemeris/src/astronomy/moshier/constant');
  const sidereal = require('../node_modules/ephemeris/src/astronomy/moshier/sidereal');
  const sidSeconds = sidereal.calc(constant.date, constant.tlong);
  let ramc = (sidSeconds / 240) % 360;
  ramc = ((ramc % 360) + 360) % 360;
  return ramc;
}

// Test 4 different ascendant formulas with the correct obliquity
function calcAsc4Ways(ramc, lat) {
  const eps = 23.4393; // mean obliquity in degrees
  const oblRad = eps * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  const ramcRad = ramc * Math.PI / 180;

  // Formula A: atan2(-cos(RAMC), sin(RAMC)*cos(eps) + tan(lat)*sin(eps))
  let a = Math.atan2(-Math.cos(ramcRad), Math.sin(ramcRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad));
  a = ((a * 180 / Math.PI) % 360 + 360) % 360;

  // Formula B: atan2(cos(RAMC), -(sin(RAMC)*cos(eps) + tan(lat)*sin(eps)))
  let b = Math.atan2(Math.cos(ramcRad), -(Math.sin(ramcRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad)));
  b = ((b * 180 / Math.PI) % 360 + 360) % 360;

  return {
    A: a,
    Aflip: (a + 180) % 360,
    B: b,
    Bflip: (b + 180) % 360,
  };
}

const testCases = [
  { name: 'Einstein', date: '1879-03-14', time: '11:30', lat: 48.4, lng: 9.98, tz: 'Europe/Berlin', expAsc: 'Aquarius', expAscDeg: 320 },
  { name: 'Diana', date: '1961-07-01', time: '18:45', lat: 52.83, lng: 0.5, tz: 'Europe/London', expAsc: 'Sagittarius', expAscDeg: 240 },
  { name: 'Obama', date: '1961-08-04', time: '19:24', lat: 21.3, lng: -157.86, tz: 'Pacific/Honolulu', expAsc: 'Aquarius', expAscDeg: 300 },
  { name: 'Swift', date: '1989-12-13', time: '05:17', lat: 40.34, lng: -75.93, tz: 'America/New_York', expAsc: 'Cancer', expAscDeg: 90 },
  { name: 'Jobs', date: '1955-02-24', time: '19:15', lat: 37.77, lng: -122.42, tz: 'America/Los_Angeles', expAsc: 'Cancer', expAscDeg: 90 },
  { name: 'Trump', date: '1946-06-14', time: '10:54', lat: 40.7, lng: -73.8, tz: 'America/New_York', expAsc: 'Leo', expAscDeg: 120 },
  { name: 'Beyonce', date: '1981-09-04', time: '10:00', lat: 29.76, lng: -95.37, tz: 'America/Chicago', expAsc: 'Sagittarius', expAscDeg: 240 },
  { name: 'Ali', date: '1942-01-17', time: '06:35', lat: 38.25, lng: -85.76, tz: 'America/New_York', expAsc: 'Taurus', expAscDeg: 60 },
  { name: 'Madonna', date: '1958-08-16', time: '07:30', lat: 43.59, lng: -83.89, tz: 'America/Detroit', expAsc: 'Virgo', expAscDeg: 150 },
  { name: 'Monroe', date: '1926-06-01', time: '09:30', lat: 34.05, lng: -118.24, tz: 'America/Los_Angeles', expAsc: 'Leo', expAscDeg: 120 },
];

// Track which formula+flip works for each
const scores = { A: 0, Aflip: 0, B: 0, Bflip: 0 };

testCases.forEach(tc => {
  const parts = tc.date.split('-').map(Number);
  const timeParts = tc.time.split(':').map(Number);
  const dt = DateTime.fromObject(
    { year: parts[0], month: parts[1], day: parts[2], hour: timeParts[0], minute: timeParts[1] },
    { zone: tc.tz }
  );
  const utc = dt.toUTC().toJSDate();

  const ramc = getRAMC(tc.lng, tc.lat, utc);
  const results = calcAsc4Ways(ramc, tc.lat);

  const mcSign = SIGNS[Math.floor(ramc / 30)];
  
  // Check which formula matches
  const checks = {};
  ['A', 'Aflip', 'B', 'Bflip'].forEach(key => {
    const sign = SIGNS[Math.floor(results[key] / 30)];
    const ok = sign === tc.expAsc;
    checks[key] = { sign, ok, deg: results[key] };
    if (ok) scores[key]++;
  });

  // Find the closest to expected degree
  let closest = '';
  let minDiff = 999;
  ['A', 'Aflip', 'B', 'Bflip'].forEach(key => {
    const diff = Math.min(Math.abs(results[key] - tc.expAscDeg), 360 - Math.abs(results[key] - tc.expAscDeg));
    if (diff < minDiff) {
      minDiff = diff;
      closest = key;
    }
  });

  console.log(
    tc.name.padEnd(12) +
    ' MC=' + mcSign.padEnd(12) +
    ' RAMC=' + ramc.toFixed(1).padStart(6) +
    ' best=' + closest +
    ' (' + minDiff.toFixed(0) + 'deg from expected ' + tc.expAscDeg + ')' +
    ' A=' + SIGNS[Math.floor(results.A / 30)].slice(0,3) + (checks.A.ok ? '*' : ' ') +
    ' B=' + SIGNS[Math.floor(results.B / 30)].slice(0,3) + (checks.B.ok ? '*' : ' ') +
    ' exp=' + tc.expAsc
  );
});

console.log('');
console.log('Scores: A=' + scores.A + ' Aflip=' + scores.Aflip + ' B=' + scores.B + ' Bflip=' + scores.Bflip);

// Also try: pick the one (raw or flip) that is closest to (MC - 90) or (MC + 90)
console.log('');
console.log('=== Testing: ASC = MC ± 90 heuristic ===');
let heuristicCorrect = 0;
testCases.forEach(tc => {
  const parts = tc.date.split('-').map(Number);
  const timeParts = tc.time.split(':').map(Number);
  const dt = DateTime.fromObject(
    { year: parts[0], month: parts[1], day: parts[2], hour: timeParts[0], minute: timeParts[1] },
    { zone: tc.tz }
  );
  const utc = dt.toUTC().toJSDate();
  const ramc = getRAMC(tc.lng, tc.lat, utc);
  const results = calcAsc4Ways(ramc, tc.lat);

  // The ascendant should be roughly 90° counterclockwise (eastward) from MC
  // But at high latitudes, it can vary. Let's just pick the formula result
  // that is closest to (MC + 90) % 360
  const target = (ramc + 90) % 360;
  let best = 'A';
  let minDiff = 999;
  ['A', 'Aflip', 'B', 'Bflip'].forEach(key => {
    const diff = Math.min(Math.abs(results[key] - target), 360 - Math.abs(results[key] - target));
    if (diff < minDiff) { minDiff = diff; best = key; }
  });

  const bestSign = SIGNS[Math.floor(results[best] / 30)];
  const ok = bestSign === tc.expAsc;
  if (ok) heuristicCorrect++;
  console.log(tc.name.padEnd(12) + ' target=' + target.toFixed(0) + ' best=' + best + ' ' + bestSign.padEnd(13) + (ok ? 'OK' : 'XX') + ' exp=' + tc.expAsc);
});
console.log('Heuristic correct: ' + heuristicCorrect + '/' + testCases.length);