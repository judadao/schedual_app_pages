const t=e=>e.trim().replace(/[\\/:*?"<>|\s]+/g,"-").replace(/^-+|-+$/g,"")||"rosterly",a=()=>new Intl.DateTimeFormat("en-CA").format(new Date);export{t as s,a as t};
