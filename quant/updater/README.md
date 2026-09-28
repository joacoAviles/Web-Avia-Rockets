# Public market updater

Copies the existing Quant `market.py` and `signals.py` adapters; no replacement pricing provider. GitHub Actions queries Yahoo using those adapters every 10 minutes (scheduler timing is not guaranteed) and writes only public quotes, daily bars, sources and research candidates to the `quant-market-data` branch.

No account module, SQLite file, portfolio, ledger, cookies, credential, or private model run is read or published. Snapshot timestamps remain visible; a failed refresh retains the previous publication. The frontend remains in `quant/` and is served by the existing GitHub Pages site. Model execution and private financial APIs remain separate authenticated services.

Canonical source: private `avia-quant` repository. Keep these adapter copies aligned when changing the canonical market contract.
