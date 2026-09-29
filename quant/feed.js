/* Market-only views. Simulations are an explicit separate dataset. */
const feedState = { prices: new Map(), changed: new Map(), latest: new Map(), busy: false, symbol: null, source: 'zesty' };
function feedPrice(q) {
  const n = el('span', money(q.price), null, {class: 'feed-price'});
  if (Date.now() - (feedState.changed.get(q.symbol) || 0) < 1800) n.classList.add('price-flash');
  return n;
}
function feedPlot(box, series, xKey, yKey, label) {
  box.replaceChildren();
  const points = series.flatMap(s => s.points).filter(p => Number.isFinite(p[xKey]) && Number.isFinite(p[yKey]));
  if (!points.length) { el('p', 'Aún no hay puntos disponibles.', box); return; }
  const xs = points.map(p=>p[xKey]), ys=points.map(p=>p[yKey]);
  const minX=Math.min(...xs), maxX=Math.max(...xs), minY=yKey==='cumulative_size'?0:Math.min(...ys), maxY=Math.max(...ys);
  const x=v=>65+(v-minX)/(maxX-minX||1)*700, y=v=>200-(v-minY)/(maxY-minY||1)*160;
  const svg=svgNode('svg',{viewBox:'0 0 800 240',role:'img','aria-label':label},box);
  svgNode('title',{},svg,label);
  for(let i=0;i<=4;i++) {
    const yy=40+i*40;
    svgNode('line',{x1:65,x2:765,y1:yy,y2:yy,stroke:'#253650'},svg);
    svgNode('text',{x:60,y:yy+4,'text-anchor':'end',fill:'#a9b8cd','font-size':11},svg,fmt(maxY-(maxY-minY)*i/4));
  }
  series.forEach(s=>{
    const valid=s.points.filter(p=>Number.isFinite(p[xKey])&&Number.isFinite(p[yKey]));
    // Split on missing values; do not draw through one-sided/unknown quotes.
    let segment=[];
    const draw=()=>{if(segment.length)svgNode('polyline',{points:segment.map(p=>`${x(p[xKey])},${y(p[yKey])}`).join(' '),fill:'none',stroke:s.color,'stroke-width':2},svg);segment=[];};
    s.points.forEach(p=>{if(Number.isFinite(p[xKey])&&Number.isFinite(p[yKey]))segment.push(p);else draw();});draw();
    valid.forEach(p=>{const dot=svgNode('circle',{cx:x(p[xKey]),cy:y(p[yKey]),r:2,fill:s.color},svg);svgNode('title',{},dot,`${s.name}: ${fmt(p[yKey])} · ${xKey==='time'?new Date(p[xKey]).toLocaleString('es-CL'):money(p[xKey])}`);});
  });
  const formatX=v=>xKey==='time'?new Date(v).toLocaleString('es-CL',{timeZone:'America/Santiago',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):money(v);
  svgNode('text',{x:65,y:225,fill:'#a9b8cd','font-size':11},svg,formatX(minX));
  svgNode('text',{x:765,y:225,'text-anchor':'end',fill:'#a9b8cd','font-size':11},svg,formatX(maxX));
  el('p',series.map(s=>s.name).join(' · '),box,{class:'muted'});
}
async function feedRequest(query) {
  const r=await fetch('/api/feed?'+new URLSearchParams(query));
  if(!r.ok)throw Error(r.status===401?'Inicia sesión en Quant para consultar Zesty.':'El servicio de captura no está disponible.');
  return r.json();
}
async function refreshFeed() {
  if(feedState.busy)return;
  feedState.busy=true;
  try {
    const source=$('feed-source').value, sym=S.symbol.replace(/\.SN$/,'');
    const result=await feedRequest({symbol:sym,source,limit:1000,timeframe:$('feed-period').value});
    if(sym!==S.symbol.replace(/\.SN$/,'') || source!==$('feed-source').value)return;
    feedState.source=source;
    const oldPeriod=$('feed-period').value;
    const periods=result.timeframes||[];
    if(JSON.stringify(periods)!==$('feed-period').dataset.periods) {
      $('feed-period').replaceChildren();
      periods.forEach(p=>el('option',p,$('feed-period'),{value:p}));
      $('feed-period').dataset.periods=JSON.stringify(periods);
      if(periods.includes(oldPeriod))$('feed-period').value=oldPeriod;
      if($('feed-period').value!==oldPeriod){setTimeout(refreshFeed,0);}
    }
    const latest=result.latest;
    const health=result.health||{};
    const age=health.received_at?(Date.now()-Date.parse(health.received_at))/1000:Infinity;
    $('feed-status').textContent=`${source==='zesty'?'Zesty · lectura':'SIMULACIÓN · datos propios'} · ${health.schedule==='outside_schedule'?'fuera del horario de captura':health.status||'sin estado'}${age>180&&health.schedule!=='outside_schedule'?' · sin healthcheck reciente':''} · ${sym}`;
    $('feed-metrics').replaceChildren();
    if(!latest) { $('feed-status').textContent+=' · sin capturas'; $('feed-depth').replaceChildren();$('feed-series').replaceChildren();$('feed-book').replaceChildren();$('feed-history').replaceChildren();return; }
    const metrics=[['Último',money(latest.price)],['Mejor bid',money(latest.best_bid)],['Mejor ask',money(latest.best_ask)],['Spread',money(latest.spread)],['Mid',money(latest.mid)],['Profundidad bid',fmt(latest.bid_depth)],['Profundidad ask',fmt(latest.ask_depth)],['Imbalance',fmt(latest.imbalance,4)],['Mercado',latest.marketInfo.isOpen?'Abierto':'Cerrado'],['Cambio observado',new Date(latest.observed_at).toLocaleString('es-CL')]];
    metrics.forEach(([name,v])=>{const n=el('div',null,$('feed-metrics'));el('small',name,n);el('strong',v,n);});
    el('p','Hora de observación del collector; Zesty no entrega hora del libro. '+(latest.quality.crossed_book?'Libro cruzado: revisar antes de usar.':''),$('feed-metrics'),{class:'muted'});
    const curves=latest.depth_curves;
    feedPlot($('feed-depth'),[{name:'Bid · azul',color:'#0A6CFF',points:curves.bids},{name:'Ask · naranja',color:'#ffae57',points:curves.asks}],'price','cumulative_size','Profundidad acumulada bid y ask; precio CLP y cantidad');
    const rows=result.snapshots.map(s=>({time:Date.parse(s.observed_at),bid:s.best_bid,ask:s.best_ask,last:s.price}));
    feedPlot($('feed-series'),[{name:'Bid · azul',color:'#0A6CFF',points:rows.map(r=>({time:r.time,price:r.bid}))},{name:'Ask · naranja',color:'#ffae57',points:rows.map(r=>({time:r.time,price:r.ask}))},{name:'Último · blanco',color:'#fff',points:rows.map(r=>({time:r.time,price:r.last}))}],'time','price','Último precio, bid y ask por hora de observación');
    feedPlot($('feed-history'),[{name:'Histórico de precios Zesty · CLP',color:'#0A6CFF',points:(result.history||[]).map(p=>({time:Date.parse(p.time),price:p.price}))}],'time','price','Histórico de precios; no contiene libros ni OHLC');
    const book=$('feed-book');book.replaceChildren();
    ['bids','asks'].forEach(side=>{const block=el('div',null,book);el('h4',side==='bids'?'Bids completos':'Asks completos',block);const table=el('table',null,block);const head=el('tr',null,table);['Precio CLP','Cantidad','Acumulado'].forEach(t=>el('th',t,head));curves[side].forEach(p=>{const row=el('tr',null,table);[money(p.price),fmt(p.size),fmt(p.cumulative_size)].forEach(v=>el('td',v,row));});});
    $('feed-metadata').textContent=JSON.stringify({metadata:latest.metadata,marketInfo:latest.marketInfo,quality:latest.quality},null,2);
    feedState.current=result;
    if(source==='zesty') {
      const all=await feedRequest({source:'zesty'});
      feedState.latest=new Map(all.snapshots.map(v=>[v.symbol+'.SN',v]));
      applyFeedQuotes();
    }
  } catch(e) { $('feed-status').textContent=e.message; }
  finally {feedState.busy=false;}
}
function applyFeedQuotes() {
  let added=false;
  for (const [key,value] of feedState.latest) {
    if (!S.quotes.some(q=>q.symbol===key)) {S.quotes.push({symbol:key,name:value.metadata.name||value.symbol,status:'ok'});added=true;}
  }
  if(added)updateSymbols();
  S.quotes.forEach(q=>{
    const live=feedState.latest.get(q.symbol);
    if(!live || live.price==null)return;
    const previous=feedState.prices.get(q.symbol);
    if(previous!=null && previous!==live.price)feedState.changed.set(q.symbol,Date.now());
    feedState.prices.set(q.symbol,live.price);
    q.price=live.price;q.status='ok';q.feed_source='zesty';q.feed_observed_at=live.observed_at;
    // Do not retain a Yahoo percentage or time alongside a Zesty price.
    q.change_pct=null;q.quote_time=null;q.session='Zesty · observación '+new Date(live.observed_at).toLocaleString('es-CL');
  });
  renderMarket();renderScreener();updateFocus();
  const focus=$('focus-price');focus.classList.add('feed-price');
  if(Date.now()-(feedState.changed.get(S.symbol)||0)<1800){focus.classList.remove('price-flash');void focus.offsetWidth;focus.classList.add('price-flash');}
}
$('feed-source').onchange=()=>{feedState.current=null;refreshFeed();};
$('feed-period').onchange=refreshFeed;
$('feed-model').onclick=action(async()=>{
  if(!feedState.current?.latest)throw Error('Aún no hay datos del libro.');
  const result=await api('/models/microstructure/analyze',{source:feedState.source,snapshots:feedState.current.snapshots.slice(-200).map(s=>({source:s.source,symbol:s.symbol,observed_at:s.observed_at,orderBook:s.orderBook}))});
  $('feed-model-result').textContent=JSON.stringify(result,null,2);
});
setInterval(refreshFeed,10000);
refreshFeed();
