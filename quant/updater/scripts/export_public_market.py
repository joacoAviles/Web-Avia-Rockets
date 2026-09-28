"""Publish only public market observations from the existing Quant adapter.

Never reads state/auth, SQLite, accounts, portfolios, or model runs.
"""
import json,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'apps/backend'))
import market,signals
OUT=ROOT/'public-api';OUT.mkdir(exist_ok=True)
def write(name,value):
    path=OUT/name;path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(market.safe(value),ensure_ascii=False,allow_nan=False))
market.refresh()
while market.snapshot()['refreshing']:time.sleep(1)
snapshot=market.snapshot()
if not snapshot['available']:raise SystemExit('No public quotes obtained; previous publication must be retained')
write('market.json',snapshot)
write('sources.json',{'sources':json.loads((ROOT/'config/sources.json').read_text()),'features':json.loads((ROOT/'config/features.json').read_text())})
signals.refresh()
while signals.RUNNING:time.sleep(1)
write('signals.json',signals.snapshot())
for (kind,*key),(_,value) in list(market.CACHE.items()):
    if kind=='bars':
        symbol,period,interval=key
        write('bars/'+symbol+'-'+period+'-'+interval+'.json',value)
print(json.dumps({'available':snapshot['available'],'universe':snapshot['universe_count'],'generated_at':snapshot['updated_at']}))
