"""Personal delayed-data adapter. Never an execution-price source."""
import json, math, threading, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
import pandas as pd
import yfinance as yf

ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/'data'; DATA.mkdir(exist_ok=True)
UNIVERSE=json.loads((ROOT/'config/universe.json').read_text())
SYMBOLS={x['symbol']:x for x in UNIVERSE}
LOCK=threading.RLock()
SNAPSHOT={'quotes':{},'refreshing':False,'updated_at':None}
CACHE={}
if (DATA/'quotes.json').exists():
    SNAPSHOT['quotes']=json.loads((DATA/'quotes.json').read_text())

def now():return datetime.now(timezone.utc).isoformat()
def safe(v):
    if isinstance(v,dict):return {str(k):safe(x) for k,x in v.items()}
    if isinstance(v,(list,tuple)):return [safe(x) for x in v]
    if isinstance(v,(datetime,pd.Timestamp)):return v.isoformat()
    if hasattr(v,'item'):v=v.item()
    if isinstance(v,float) and not math.isfinite(v):return None
    return v

def check(symbol):
    if symbol not in SYMBOLS:raise ValueError('Instrumento fuera del universo chileno')
    return symbol

def info_for(symbol):
    symbol=check(symbol); key=('info',symbol)
    with LOCK:
        hit=CACHE.get(key)
        if hit and time.time()-hit[0]<300:return hit[1]
    value=yf.Ticker(symbol).get_info()
    if value.get('quoteType')!='EQUITY' or value.get('exchange') not in ('SGO','Santiago') or value.get('currency')!='CLP':
        raise ValueError('Yahoo no confirmó acción chilena EQUITY / SGO / CLP')
    with LOCK:CACHE[key]=(time.time(),value)
    return value

def quote(symbol):
    try:
        info=info_for(symbol)
        d=yf.Ticker(symbol).history(period='5d',interval='1d',auto_adjust=False,timeout=12)
        if d.empty:raise ValueError('Sin precios publicados')
        r=d.iloc[-1];price=float(info.get('regularMarketPrice') or r.Close)
        prev=info.get('regularMarketPreviousClose') or (float(d.iloc[-2].Close) if len(d)>1 else None)
        stamp=info.get('regularMarketTime')
        return {'symbol':symbol,'name':info.get('shortName',symbol),'price':price,'previous':prev,
                'change_pct':100*(price/prev-1) if prev else None,'volume':int(info.get('regularMarketVolume') or r.Volume),
                'turnover_estimate':price*float(r.Volume),'market_cap':info.get('marketCap'),
                'pe':info.get('trailingPE'),'dividend_yield':info.get('dividendYield'),
                'sector':info.get('sector'),'session':str(d.index[-1].date()),
                'quote_time':datetime.fromtimestamp(stamp,timezone.utc).isoformat() if stamp else None,
                'fetched_at':now(),'source':'Yahoo Finance / ICE','delay_minutes':15,
                'mode':'delayed','status':'ok','currency':'CLP','verified_equity':True}
    except Exception as e:
        with LOCK:old=SNAPSHOT['quotes'].get(symbol)
        if old and old.get('price') is not None:
            return {**old,'status':'stale','error':str(e),'refresh_failed_at':now()}
        return {'symbol':symbol,'name':symbol,'status':'unavailable','error':str(e),'fetched_at':now(),'mode':'unavailable'}

def refresh(on_complete=None):
    with LOCK:
        if SNAPSHOT['refreshing']:return False
        SNAPSHOT['refreshing']=True
    def worker():
        try:
            # Original research symbols first, then unverified public-list candidates.
            names=sorted(SYMBOLS,key=lambda x:SYMBOLS[x]['mapping']!='legacy')
            with ThreadPoolExecutor(max_workers=3) as pool:
                futures=[pool.submit(quote,symbol) for symbol in names]
                for future in as_completed(futures):
                    result=future.result()
                    with LOCK:SNAPSHOT['quotes'][result['symbol']]=safe(result)
            with LOCK:
                SNAPSHOT['updated_at']=now()
                (DATA/'quotes.json').write_text(json.dumps(SNAPSHOT['quotes'],allow_nan=False))
        finally:
            with LOCK:SNAPSHOT['refreshing']=False
            if on_complete is not None:on_complete()
    threading.Thread(target=worker,daemon=True).start();return True

def snapshot():
    with LOCK:
        rows=[{**x,**SNAPSHOT['quotes'].get(x['symbol'],{'status':'pending'})} for x in UNIVERSE]
        return {'quotes':rows,'refreshing':SNAPSHOT['refreshing'],'updated_at':SNAPSHOT['updated_at'],
                'universe_count':len(rows),'available':sum(x.get('status')=='ok' for x in rows),
                'source':'Yahoo Finance / ICE','mode':'delayed','delay_minutes':15}

def bars(symbol,period='1y',interval='1d'):
    check(symbol)
    if period not in ('1mo','3mo','6mo','1y','2y','5y') or interval not in ('15m','60m','1d','1wk','1mo'):
        raise ValueError('Rango o intervalo inválido')
    info_for(symbol)
    if interval in ('15m','60m'):period='1mo'
    key=('bars',symbol,period,interval)
    with LOCK:
        hit=CACHE.get(key)
        if hit and time.time()-hit[0]<120:return hit[1]
    d=yf.Ticker(symbol).history(period=period,interval=interval,auto_adjust=False,actions=True,timeout=15)
    if d.empty:raise ValueError('El proveedor no entrega barras para este intervalo')
    rows=[];rejected=[]
    for dt,r in d.iterrows():
        vals={k:float(r[k.title()]) for k in ('open','high','low','close','volume')}
        if not all(math.isfinite(vals[k]) and vals[k]>0 for k in ('open','high','low','close')) or vals['high']<max(vals['open'],vals['close'],vals['low']) or vals['low']>min(vals['open'],vals['close'],vals['high']):
            rejected.append({'date':dt.isoformat(),'reason':'invalid OHLC'});continue
        rows.append({'time':int(dt.timestamp()),'date':dt.isoformat(),**vals,'dividend':float(r.get('Dividends',0)), 'split':float(r.get('Stock Splits',0))})
    result=safe({'symbol':symbol,'bars':rows,'interval':interval,'period':period,'source':'Yahoo Finance','mode':'delayed','delay_minutes':15,'fetched_at':now(),'rejected_bars':rejected,'adjustment':'auto_adjust=False; provider history semantics'})
    with LOCK:CACHE[key]=(time.time(),result)
    return result

def details(symbol):
    info=info_for(symbol);ticker=yf.Ticker(symbol);errors=[]
    from fundamentals import extract
    fundamentals,statements=extract(info,ticker,errors)
    keys=['longName','sector','industry','website','longBusinessSummary','financialCurrency','currency']
    news=[]
    try:
        for n in ticker.news[:15]:
            c=n.get('content',n);url=(c.get('canonicalUrl') or {}).get('url') or n.get('link')
            if url and url.startswith('https://'):news.append({'title':c.get('title','Noticia'),'url':url,'publisher':(c.get('provider') or {}).get('displayName',n.get('publisher','')),'date':c.get('pubDate')})
    except Exception as e:errors.append('Noticias: '+str(e))
    events=[]
    try:
        for b in bars(symbol,'5y')['bars']:
            if b['dividend'] or b['split']:events.append({'date':b['date'][:10],'dividend':b['dividend'],'split':b['split']})
    except Exception as e:errors.append('Eventos: '+str(e))
    return safe({'symbol':symbol,'profile':{k:info.get(k) for k in keys},'fundamentals':fundamentals,'statements':statements,'news':news,'events':events[-40:],'errors':errors,'fetched_at':now(),'source':'Yahoo Finance; coverage by field varies'})
