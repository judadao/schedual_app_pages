import{F as s,G as o}from"./index-D2NsgIbc.js";function c({error:a,retry:n,loading:e=!1,updatedAt:r}){return s.jsxs("section",{className:"mb-5",children:[s.jsx(o,{message:`${r?`未能更新，以下為 ${new Date(r).toLocaleString("zh-TW")} 的資料。`:"暫時無法讀取資料，請重新嘗試。"}
${a}`}),s.jsx("button",{className:"btn-secondary",disabled:e,onClick:n,children:e?"重新讀取中…":"重新讀取"})]})}export{c as P};
