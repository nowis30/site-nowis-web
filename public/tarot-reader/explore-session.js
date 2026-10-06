(() => {
  'use strict';
  let selections = {};
  const clone=value=>JSON.parse(JSON.stringify(value));
  window.EXPLORE_SESSION=Object.freeze({
    getContext:()=>clone(selections),
    set:(key,value)=>{if(value===null)delete selections[key];else selections[key]=clone(value);window.dispatchEvent(new Event('explore:changed'));},
    clear:()=>{selections={};window.dispatchEvent(new Event('explore:changed'));}
  });
})();
