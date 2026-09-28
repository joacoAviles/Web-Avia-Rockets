"""Explainable research candidates using existing public market adapters."""
import math, threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
import market
LOCK=threading.Lock()
RESULT={'buy':[],'sell':[],'excluded':[],'generated_at':None}
RUNNING=False

def recent(stamp,seconds):
    try:return 0 <= (datetime.now(timezone.utc)-datetime.fromisoformat(stamp)).total_seconds() <= seconds
    except (ValueError,TypeError):return False

def price_note(q):
    if q.get('status')=='stale':return 'Último precio guardado: falló la actualización de la API. Revisar fecha.'
    if not q.get('quote_time'):return 'Último precio de la API; hora de negociación no disponible.'
    if not recent(q.get('quote_time'),2700):return 'Último precio disponible de la API; puede corresponder al cierre o a una operación anterior.'
    return 'Último precio disponible de la API; fuente diferida.'

def candidate(q,info,bars):
    if q.get('status') not in ('ok','stale'):raise ValueError('Sin precio disponible de la API')
    if not isinstance(q.get('price'),(int,float)) or not math.isfinite(q['price']) or q['price']<=0:raise ValueError('Precio inválido de la API')
    if info.get('currency')!='CLP':raise ValueError('Moneda no comparable')
    keys=('targetMeanPrice','numberOfAnalystOpinions','profitMargins','returnOnEquity')
    if any(not isinstance(info.get(k),(int,float)) or not math.isfinite(info[k]) for k in keys):raise ValueError('Fundamentales/consenso incompletos')
    price=q['price'];target=info['targetMeanPrice']
    if price<=0 or target<=0 or info['numberOfAnalystOpinions']<3:raise ValueError('Consenso insuficiente (mínimo 3 analistas)')
    if len(bars)<50:raise ValueError('Histórico insuficiente (mínimo 50 barras)')
    if any(b.get('split') for b in bars[-50:]):raise ValueError('Split reciente: requiere conciliación del histórico')
    closes=[b['close'] for b in bars[-50:]]
    if any(not math.isfinite(v) or v<=0 for v in closes):raise ValueError('Histórico inválido')
    sma20=sum(closes[-20:])/20;sma50=sum(closes)/50;upside=target/price-1
    buy=upside>=.15 and info['profitMargins']>0 and info['returnOnEquity']>0 and price>sma20>sma50
    sell=upside<=-.10 and price<sma20<sma50
    if not (buy or sell):raise ValueError('Sin confluencia de valoración y tendencia')
    side='buy' if buy else 'sell'
    return {'symbol':q['symbol'],'side':side,'price':price,'entry':price,'exit':target,'score':round(abs(upside)*100,2),'quote_time':q['quote_time'],'fetched_at':q['fetched_at'],'source':q.get('source'),'mode':q.get('mode','delayed'),'delay_minutes':q.get('delay_minutes'),'price_status':('cached' if q.get('status')=='stale' else 'last_available'),'price_note':price_note(q),'history_note':('Últimas barras disponibles de la API' if recent(bars[-1].get('date'),7*86400) else 'Histórico antiguo: consultar fecha de la última barra antes de decidir'),
      'explanation':('Compra exploratoria: margen al consenso ≥15%, rentabilidad positiva y tendencia SMA20/50 ascendente.' if buy else 'Revisión de venta/reducción: consenso ≥10% bajo el precio y tendencia SMA20/50 descendente. La salida indica posible reevaluación; no implica abrir un corto.'),
      'evidence':{'targetMeanPrice':target,'numberOfAnalystOpinions':info['numberOfAnalystOpinions'],'profitMargins':info['profitMargins'],'returnOnEquity':info['returnOnEquity'],'sma20':sma20,'sma50':sma50,'last_bar':bars[-1]['date'],'fundamentals_source':'Yahoo Finance / quoteSummary','fundamentals_observed_at':market.now(),'fundamentals_publication_date':None},
      'limitations':'Regla heurística v1 no validada como predictor. Consenso estimado, fecha de revisión no disponible; sin probabilidad calibrada. Precios orientativos sin garantía de ejecución; no incluye costes ni liquidez. Horizonte de reevaluación 6–12 meses, no vencimiento del consenso.'}

def refresh():
    global RUNNING
    with LOCK:
        if RUNNING:return False
        RUNNING=True
    def work():
        global RESULT,RUNNING
        result={'buy':[],'sell':[],'excluded':[],'generated_at':None}
        def one(q):
            try:
                if q.get('status') not in ('ok','stale'):raise ValueError('Sin precio disponible de la API')
                return candidate(q,market.info_for(q['symbol']),market.bars(q['symbol'],'1y','1d')['bars'])
            except Exception as e:return {'symbol':q['symbol'],'reason':str(e)}
        try:
            with ThreadPoolExecutor(max_workers=3) as pool:
                for row in pool.map(one,market.snapshot()['quotes']):
                    result[row['side'] if 'side' in row else 'excluded'].append(row)
            for side in ('buy','sell'):result[side]=sorted(result[side],key=lambda x:(-x['score'],x['symbol']))[:5]
            result['generated_at']=market.now()
            with LOCK:RESULT=result
        finally:
            with LOCK:RUNNING=False
    threading.Thread(target=work,daemon=True).start();return True

def snapshot():
    with LOCK:result={**RESULT,'refreshing':RUNNING,'buy':list(RESULT['buy']),'sell':list(RESULT['sell'])}
    for side in ('buy','sell'):
        result[side]+=[{'unavailable':True,'reason':'Sin candidato con evidencia suficiente en los datos de la API'}]*(5-len(result[side]))
    result['mode']='delayed';result['method']='fundamental-trend-v2';result['realtime_available']=False
    return result
