import sky = require('./astro-engine.js');
type Input = Parameters<typeof sky.calculate>[0];
type Natal = ReturnType<typeof sky.calculate>['natal'];
type Point = Natal['planets'][number];
type Reduction = {value:number;steps:number[];parts?:number[];letters?:string;values?:number[]};
declare const engine: {
 dateParts(value:string):number[];
 reduce(value:number,masters?:boolean):Reduction;
 letters(name:string):string;
 nameNumber(name:string,mode?:string,yVowel?:boolean):Reduction|null;
 numerology(input:{birthDate:string;date:string;name?:string;yVowel?:boolean}):Record<string,Reduction|null>;
 synastry(a:Input,b:Input):{first:Natal;second:Natal;aspects:{first:Point;second:Point;angle:number;orb:number}[]};
 moon(date:string):{phase:number;illumination:number;events:{name:string;angle:number;utc:string}[];sign:Point};
 solarReturn(input:Input,year:number):{utc:string;planets:Point[];angles:{ascendant:Point|null;midheaven:Point|null;houses:unknown[];reason:string|null};error:number};
};
export = engine;
