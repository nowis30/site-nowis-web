const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const engine=require('../public/tarot-reader/explore-engine.js');
const sky=require('../public/tarot-reader/astro-engine.js');
const belline=require('../public/tarot-reader/belline-data.js');
const numbers=require('../public/tarot-reader/numerology-meanings.js');
const birth={birthDate:'1990-01-15',birthTime:'10:30',latitude:45.5088,longitude:-73.5878,timeZone:'America/Toronto',forecastDate:'2026-10-06'};

test('real browser and Node engines agree without network or storage for every exploration calculation',()=>{
 const calls=[];
 const context=vm.createContext({
  window:{},Intl,Date,
  fetch:()=>{calls.push('fetch');throw new Error('Calculations must remain local');},
  localStorage:{getItem:()=>{calls.push('storage');throw new Error('Calculations must remain ephemeral');}},
 });
 // Run the actual browser distribution and both global-script entry points;
 // do not inject the CommonJS engine into the browser or mock its calculations.
 for(const file of ['vendor/astronomy.browser.min.js','astro-engine.js','explore-engine.js']){
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/tarot-reader',file),'utf8'),context,{filename:file});
 }
 const browser=context.window.ORACLE_EXPLORE;
 const plain=value=>JSON.parse(JSON.stringify(value));
 const cases=[
  ['dateParts',['2024-02-29']],
  ['reduce',[75]],
  ['letters',['Cœur Ægir']],
  ['nameNumber',['Lynn','vowels',true]],
  ['numerology',[{birthDate:'1980-10-22',date:'2026-10-06',name:'Éléonore',yVowel:true}]],
  ...['1900-01-15','2000-02-29','2026-10-06','2100-12-01'].map(date=>['moon',[date]]),
  ['solarReturn',[birth,2027]],
  ['solarReturn',[{...birth,birthDate:'2000-02-29'},2027]],
  ['synastry',[birth,{...birth,birthDate:'1992-07-08',birthTime:'13:20'}]],
  ['synastry',[{...birth,unknownTime:true},{...birth,birthDate:'1992-07-08',birthTime:'13:20'}]],
 ];
 for(const [method,args] of cases){
  assert.deepEqual(plain(browser[method](...args)),plain(engine[method](...args)),`${method} ${JSON.stringify(args)}`);
 }
 assert.deepEqual(calls,[]);
});
test('published numerology examples reproduce the documented methods',()=>{
 assert.equal(engine.numerology({birthDate:'1980-10-22',date:'2020-03-16'}).life.value,5);
 assert.deepEqual(engine.nameNumber('NICHOLAS EVAN SMITH').steps,[75,12,3]);
 assert.equal(engine.numerology({birthDate:'1990-10-12',date:'2020-03-16'}).day.value,9);
 assert.equal(engine.numerology({birthDate:'1990-11-20',date:'2022-01-01'}).year.value,1);
});
test('name normalization, explicit Y choice and empty vowel subsets remain well defined',()=>{
 assert.equal(engine.nameNumber('Éléonore').value,engine.nameNumber('Eleonore').value);
 assert.equal(engine.letters('Cœur Ægir'),'COEURAEGIR');
 assert.equal(engine.nameNumber('Lynn','vowels',false),null);
 assert.equal(engine.nameNumber('Lynn','vowels',true).value,7);
 for(const name of ['', '123', '<script>', 'Жан'])assert.throws(()=>engine.nameNumber(name));
});
test('invalid and impossible dates never roll into another month',()=>{
 for(const date of ['2023-02-29','2026-04-31','1899-12-31','2101-01-01','2026-13-01','2026-1-1'])assert.throws(()=>engine.dateParts(date));
 assert.deepEqual(engine.dateParts('2024-02-29'),[2024,2,29]);
 assert.equal(engine.reduce(22).value,22);assert.equal(engine.reduce(22,false).value,4);
});
test('four lunar phases agree within two minutes with independent USNO April 2024 table',()=>{
 // https://aa.usno.navy.mil/calculated/moon/phases?date=2024-4-08&format=p&nump=5&submit=Get+Data
 const expected=['2024-04-08T18:21:00Z','2024-04-15T19:13:00Z','2024-04-23T23:49:00Z','2024-05-01T11:27:00Z'];
 const result=engine.moon('2024-04-08');
 result.events.forEach((event,i)=>assert.ok(Math.abs(Date.parse(event.utc)-Date.parse(expected[i]))<120000,event.utc));
 assert.ok(result.illumination>=0&&result.illumination<=1);
});
test('solar return converges on the natal longitude, including leap-day births',()=>{
 for(const input of [birth,{...birth,birthDate:'2000-02-29'},{...birth,birthDate:'1990-12-31'}]){
  const result=engine.solarReturn(input,2027), natal=sky.calculate(input).natal.planets[0];
  assert.ok(result.error<0.00002);
  assert.ok(sky.angularDistance(natal.longitude,result.planets[0].longitude)<0.00002);
  assert.equal(new Date(result.utc).getUTCFullYear(),2027);
 }
 assert.throws(()=>engine.solarReturn({...birth,unknownTime:true},2027));
 assert.throws(()=>engine.solarReturn(birth,2027.5));
});
test('synastry is symmetric and excludes uncertain lunar data',()=>{
 const b={...birth,birthDate:'1992-07-08',birthTime:'13:20'};
 const ab=engine.synastry(birth,b),ba=engine.synastry(b,birth);
 const key=a=>[a.first.id,a.second.id,a.angle,a.orb.toFixed(4)].join(':');
 assert.deepEqual(ab.aspects.map(key).sort(),ba.aspects.map(a=>key({...a,first:a.second,second:a.first})).sort());
 const unknown=engine.synastry({...birth,unknownTime:true},b);
 assert.ok(unknown.aspects.every(a=>a.first.id!=='Moon'&&!a.first.uncertain));
});
test('all new definitions have a unique reference and bounded original summaries',()=>{
 assert.equal(belline.length,53);assert.equal(new Set(belline.map(c=>c.source.url)).size,53);
 belline.forEach((c,i)=>{assert.equal(c.id,i);assert.match(c.source.url,/^https:\/\/www\.oracle-de-belline\.com\//);assert.ok((c.meaning+' '+c.question).split(/\s+/).length<200);});
 assert.equal(Object.keys(numbers).length,12);
 Object.values(numbers).forEach(n=>assert.ok((n.meaning+' '+n.balance).split(/\s+/).length<200));
});
