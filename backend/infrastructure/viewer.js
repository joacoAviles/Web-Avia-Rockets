import RFB from './core/rfb.js';
const screen=document.querySelector('#screen'),notice=document.querySelector('#notice');
let retry;
function connect(){
 const rfb=new RFB(screen,`wss://${location.host}/stream`);
 rfb.scaleViewport=true; rfb.resizeSession=true; rfb.showDotCursor=true;
 rfb.addEventListener('connect',()=>{notice.hidden=true;parent.postMessage({type:'infra-connection',connected:true},'https://aviarockets.cl')});
 rfb.addEventListener('disconnect',()=>{notice.hidden=false;notice.textContent='Reconectando con tu escritorio…';parent.postMessage({type:'infra-connection',connected:false},'https://aviarockets.cl');clearTimeout(retry);retry=setTimeout(connect,2500)});
}
connect();
