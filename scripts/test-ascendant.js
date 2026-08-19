const e = require('ephemeris');
const { DateTime } = require('luxon');

const testCases = [
  { name: 'Einstein', date: '1879-03-14', time: '11:30', lat: 48.4, lng: 9.98, tz: 'Europe/Berlin', expSun: 'Pisces', expAsc: 'Aquarius' },
  { name: 'Diana', date: '1961-07-01', time: '18:45', lat: 52.83, lng: 0.5, tz: 'Europe/London', expSun: 'Cancer', expAsc: 'Sagittarius' },
  { name: 'Obama', date: '1961-08-04', time: '19:24', lat: 21.3, lng: -157.86, tz: 'Pacific/Honolulu', expSun: 'Leo', expAsc: 'Aquarius' },
  { name: 'Swift', date: '1989-12-13', time: '05:17', lat: 40.34, lng: -75.93, tz: 'America/New_York', expSun: 'Sagittarius', expAsc: 'Cancer' },
  { name: 'Jobs', date: '1955-02-24', time: '19:15', lat: 37.77, lng: -122.42, tz: 'America/Los_Angeles', expSun: 'Pisces', expAsc: 'Cancer' },
  { name: 'Madonna', date: '1958-08-16', time: '07:30', lat: 43.59, lng: -83.89, tz: 'America/Detroit', expSun: 'Leo', expAsc: 'Virgo' },
  { name: 'Trump', date: '1946-06-14', time: '10:54', lat: 40.7, lng: -73.8, tz: 'America/New_York', expSun: 'Gemini', expAsc: 'Leo' },
  { name: 'Queen E2', date: '1926-04-21', time: '02:40', lat: 51.5, lng: -0.1, tz: 'Europe/London', expSun: 'Taurus', expAsc: 'Capricorn' },
  { name: 'Lennon', date: '1940-10-09', time: '18:30', lat: 53.4, lng: -3, tz: 'Europe/London', expSun: 'Libra', expAsc: 'Aries' },
  { name: 'Monroe', date: '1926-06-01', time: '09:30', lat: 34.05, lng: -118.24, tz: 'America/Los_Angeles', expSun: 'Gemini', expAsc: 'Leo' },
  { name: 'DiCaprio', date: '1974-11-11', time: '02:47', lat: 34.05, lng: -118.24, tz: 'America/Los_Angeles', expSun: 'Scorpio', expAsc: 'Libra' },
  { name: 'Beyonce', date: '1981-09-04', time: '10:00', lat: 29.76, lng: -95.37, tz: 'America/Chicago', expSun: 'Virgo', expAsc: 'Sagittarius' },
  { name: 'Bowie', date: '1947-01-08', time: '09:00', lat: 51.5, lng: -0.1, tz: 'Europe/London', expSun: 'Capricorn', expAsc: 'Aquarius' },
  { name: 'Oprah', date: '1954-01-29', time: '04:30', lat: 33.04, lng: -89.59, tz: 'America/Chicago', expSun: 'Aquarius', expAsc: 'Sagittarius' },
  { name: 'Van Gogh', date: '1853-03-30', time: '11:00', lat: 51.47, lng: 4.66, tz: 'Europe/Amsterdam', expSun: 'Aries', expAsc: 'Pisces' },
  { name: 'Jung', date: '1875-07-26', time: '18:25', lat: 47.6, lng: 9.33, tz: 'Europe/Zurich', expSun: 'Leo', expAsc: 'Aquarius' },
  { name: 'Kahlo', date: '1907-07-06', time: '08:30', lat: 19.35, lng: -99.16, tz: 'America/Mexico_City', expSun: 'Cancer', expAsc: 'Leo' },
  { name: 'Ali', date: '1942-01-17', time: '06:35', lat: 38.25, lng: -85.76, tz: 'America/New_York', expSun: 'Capricorn', expAsc: 'Taurus' },
  { name: 'Adele', date: '1988-05-05', time: '08:19', lat: 51.5, lng: -0.1, tz: 'Europe/London', expSun: 'Taurus', expAsc: 'Gemini' },
  { name: 'Shakespeare', date: '1564-04-23', time: '08:30', lat: 52.19, lng: -1.71, tz: 'Europe/London', expSun: 'Taurus', expAsc: 'Taurus' },
];

const signs = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

function calcAscendant(lng, lat, date) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const t = (jd - 2451545.0) / 36525.0;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t;
  gmst = ((gmst % 360) + 360) % 360;
  const lst = (((gmst + lng) % 360) + 360) % 360;
  const ramc = lst;
  const obl = 23.4393 * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  const ramcRad = ramc * Math.PI / 180;

  const y = Math.cos(ramcRad);
  const x = -(Math.sin(ramcRad) * Math.cos(obl) + Math.tan(latRad) * Math.sin(obl));
  let asc = Math.atan2(y, x) * 180 / Math.PI;
  asc = ((asc % 360) + 360) % 360;

  return { asc, ramc };
}

let correct = 0;
let wrong = 0;
let nearMiss = 0;
const results = [];

testCases.forEach((tc, i) => {
  const [y2, m, d] = tc.date.split('-').map(Number);
  const [h, min] = tc.time.split(':').map(Number);
  const localDT = DateTime.fromObject({ year: y2, month: m, day: d, hour: h, minute: min }, { zone: tc.tz });
  const utcDate = localDT.toUTC().toJSDate();

  const r = e.getAllPlanets(utcDate, tc.lng, tc.lat, 0);
  const sunLong = r.observed.sun.apparentLongitudeDd;
  const sunSign = signs[Math.floor(sunLong / 30)];

  const { asc, ramc } = calcAscendant(tc.lng, tc.lat, utcDate);
  const ascSign = signs[Math.floor(asc / 30)];
  const mcSign = signs[Math.floor(ramc / 30)];

  const sunOk = sunSign === tc.expSun;
  const ascOk = ascSign === tc.expAsc;

  let status = 'WRONG';
  if (sunOk && ascOk) {
    correct++;
    status = 'OK';
  } else if (sunOk) {
    const ascIdx = signs.indexOf(ascSign);
    const expIdx = signs.indexOf(tc.expAsc);
    const diff = Math.abs(ascIdx - expIdx);
    const adjDiff = Math.min(diff, 12 - diff);
    if (adjDiff === 1) {
      nearMiss++;
      status = 'NEAR';
    } else {
      wrong++;
      status = 'WRONG';
    }
  } else {
    wrong++;
    status = 'WRONG';
  }

  results.push({
    n: i + 1,
    name: tc.name,
    sun: sunSign,
    expSun: tc.expSun,
    sunOk,
    asc: ascSign,
    expAsc: tc.expAsc,
    ascOk,
    mc: mcSign,
    ascDeg: asc.toFixed(1),
    status,
  });
});

// Print results
console.log('Num  Name          Sun( calc/exp )  Asc( calc/exp )  MC      AscDeg  Status');
console.log('---  -----------   ---------------  ---------------  ------  ------  ------');
results.forEach(r => {
  const sunStr = (r.sunOk ? 'OK ' : 'XX ') + r.sun.padEnd(11) + r.expSun.padEnd(11);
  const ascStr = (r.ascOk ? 'OK ' : 'XX ') + r.asc.padEnd(13) + r.expAsc.padEnd(13);
  console.log(
    String(r.n).padStart(2) + '   ' +
    r.name.padEnd(13) +
    sunStr + '  ' +
    ascStr + '  ' +
    r.mc.padEnd(7) +
    r.ascDeg.padStart(7) + '  ' +
    r.status
  );
});

console.log('');
console.log('=== RESULTS ===');
console.log('Correct:    ' + correct + '/20');
console.log('Near miss:  ' + nearMiss + '/20');
console.log('Wrong:      ' + wrong + '/20');