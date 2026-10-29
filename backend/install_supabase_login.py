"""Apply only to the inspected PROD01 auth layout; fail on source drift.
Usage: python backend/install_supabase_login.py /path/to/api
"""
import ast
from pathlib import Path
import shutil
import sys

root = Path(sys.argv[1]).resolve()
target = root / 'app/api/auth.py'
helper = root / 'app/api/supabase_identity.py'
source = target.read_text()
old = 'if user is None or not verify_password(payload.password, user.password_hash):'
needle = 'async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> dict:\n'
if source.count(old) != 1 or source.count(needle) != 1:
    raise SystemExit('Unexpected auth layout or already installed; inspect before applying.')
new = 'from app.api.supabase_identity import verify_supabase_identity\n' + source
new = new.replace(needle, needle + '    await verify_supabase_identity(str(payload.email), payload.password)\n', 1)
new = new.replace(old, 'if user is None:', 1)
ast.parse(new)
backup = target.with_suffix('.py.before-supabase')
if backup.exists() or helper.exists():
    raise SystemExit('Existing backup/helper; inspect before applying.')
shutil.copy2(target, backup)
shutil.copy2(Path(__file__).with_name('supabase_identity.py'), helper)
target.write_text(new)
print('Patched login; restart and verify the API before publishing.')
