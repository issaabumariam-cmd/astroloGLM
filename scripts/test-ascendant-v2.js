const e = require('ephemeris');
const { DateTime } = require('luxon');
const constant = require('../node_modules/ephemeris/src/astronomy/moshier/constant');
const sidereal = require('../node_modules/ephemeris/src/astronomy/moshier/sidereal');
const processor = require('../node_modules/ephemeris/src/astronomy/moshier/processor');

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

function getMoshierRAMC(lng, lat, date) {
  constant.tlong = lng;
  constant.glat = lat;
  constant.height = 0;
  constant.date = {
    day: date.getUTCDate(),
    month: date.getUTCMonth() + 1,
    year: date.getUTCFullYear(),
    hours: date.getUTCHours(),
    minutes: date.getUTCMinutes(),
    seconds: date.getUTCSeconds()
  };
  processor.init();

  const sidSeconds = sidereal.calc(constant.date, constant.tlong);
  let ramc = (sidSeconds / 240) % 360;
  ramc = ((ramc % 360) + 360) % 360;
  return ramc;
}

function calcAsc(ramc, lat) {
  const eps = constant.eps * constant.RTD;
  const oblRad = eps * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  const ramcRad = ramc * Math.PI / 180;

  const y = -Math.cos(ramcRad);
  const x = Math.sin(ramcRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad);
  let asc = Math.atan2(y, x) * 180 / Math.PI;
  asc = ((asc % 360) + 360) % 360;
  return { asc, flip: (asc + 180) % 360 };
}

const testCases = [
  { name: 'Einstein', date: '1879-03-14', time: '11:30', lat: 48.4, lng: 9.98, tz: 'Europe/Berlin', expAsc: 'Aquarius' },
  { name: 'Diana', date: '1961-07-01', time: '18:45', lat: 52.83, lng: 0.5, tz: 'Europe/London', expAsc: 'Sagittarius' },
  { name: 'Obama', date: '1961-08-04', time: '19:24', lat: 21.3, lng: -157.86, tz: 'Pacific/Honolulu', expAsc: 'Aquarius' },
  { name: 'Swift', date: '1989-12-13', time: '05:17', lat: 40.34, lng: -75.93, tz: 'America/New_York', expAsc: 'Cancer' },
  { name: 'Jobs', date: '1955-02-24', time: '19:15', lat: 37.77, lng: -122.42, tz: 'America/Los_Angeles', expAsc: 'Cancer' },
  { name: 'Trump', date: '1946-06-14', time: '10:54', lat: 40.7, lng: -73.8, tz: 'America/New_York', expAsc: 'Leo' },
  { name: 'Beyonce', date: '1981-09-04', time: '10:00', lat: 29.76, lng: -95.37, tz: 'America/Chicago', expAsc: 'Sagittarius' },
  { name: 'Ali', date: '1942-01-17', time: '06:35', lat: 38.25, lng: -85.76, tz: 'America/New_York', expAsc: 'Taurus' },
  { name: 'Madonna', date: '1958-08-16', time: '07:30', lat: 43.59, lng: -83.89, tz: 'America/Detroit', expAsc: 'Virgo' },
  { name: 'Monroe', date: '1926-06-01', time: '09:30', lat: 34.05, lng: -118.24, tz: 'America/Los_Angeles', expAsc: 'Leo' },
  { name: 'Queen E2', date: '1926-04-21', time: '02:40', lat: 51.5, lng: -0.1, tz: 'Europe/London', expAsc: 'Capricorn' },
  { name: 'Lennon', date: '1940-10-09', time: '18:30', lat: 53.4, lng: -3, tz: 'Europe/London', expAsc: 'Aries' },
  { name: 'DiCaprio', date: '1974-11-11', time: '02:47', lat: 34.05, lng: -118.24, tz: 'America/Los_Angeles', expAsc: 'Libra' },
  { name: 'Bowie', date: '1947-01-08', time: '09:00', lat: 51.5, lng: -0.1, tz: 'Europe/London', expAsc: 'Aquarius' },
  { name: 'Oprah', date: '1954-01-29', time: '04:30', lat: 33.04, lng: -89.59, tz: 'America/Chicago', expAsc: 'Sagittarius' },
  { name: 'Van Gogh', date: '1853-03-30', time: '11:00', lat: 51.47, lng: 4.66, tz: 'Europe/Amsterdam', expAsc: 'Pisces' },
  { name: 'Jung', date: '1875-07-26', time: '18:25', lat: 47.6, lng: 9.33, tz: 'Europe/Zurich', expAsc: 'Aquarius' },
  { name: 'Kahlo', date: '1907-07-06', time: '08:30', lat: 19.35, lng: -99.16, tz: 'America/Mexico_City', expAsc: 'Leo' },
  { name: 'Adele', date: '1988-05-05', time: '08:19', lat: 51.5, lng: -0.1, tz: 'Europe/London', expAsc: 'Gemini' },
  { name: 'Shakespeare', date: '1564-04-23', time: '08:30', lat: 52.19, lng: -1.71, tz: 'Europe/London', expAsc: 'Taurus' },
];

let rawCorrect = 0;
let flipCorrect = 0;

console.log('Name          MC           RAMC     raw              flip             expected');
console.log('-----------   ----------   ------   --------------   --------------   -----------');

testCases.forEach(tc => {
  const parts = tc.date.split('-').map(Number);
  const timeParts = tc.time.split(':').map(Number);
  const dt = DateTime.fromObject(
    { year: parts[0], month: parts[1], day: parts[2], hour: timeParts[0], minute: timeParts[1] },
    { zone: tc.tz }
  );
  const utc = dt.toUTC().toJSDate();

  const ramc = getMoshierRAMC(tc.lng, tc.lat, utc);
  const result = calcAsc(ramc, tc.lat);
  
  const mcSignIdx = Math.floor(ramc / 30);
  const ascSignIdx = Math.floor(result.asc / 30);
  const flipSignIdx = Math.floor(result.flip / 30);
  
  const mcSign = SIGNS[mcSignIdx] || '?';
  const ascSign = SIGNS[ascSignIdx] || '?';
  const flipSign = SIGNS[flipSignIdx] || '?';
  
  const rawOk = ascSign === tc.expAsc;
  const flipOk = flipSign === tc.expAsc;
  if (rawOk) rawCorrect++;
  if (flipOk) flipCorrect++;

  console.log(
    tc.name.padEnd(13) +
    mcSign.padEnd(13) +
    ramc.toFixed(2).padStart(7) + '   ' +
    ascSign.padEnd(15) + (rawOk ? 'OK ' : 'XX ') +
    flipSign.padEnd(15) + (flipOk ? 'OK ' : 'XX ') +
    tc.expAsc
  );
});

console.log('');
console.log('Raw correct:  ' + rawCorrect + '/' + testCases.length);
console.log('Flip correct: ' + flipCorrect + '/' + testCases.length);
console.log('Either correct: ' + (rawCorrect + flipCorrect) + '/' + testCases.length + ' (max should be ' + testCases.length + ')');