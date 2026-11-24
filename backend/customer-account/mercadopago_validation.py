"""Pure validation for Mercado Pago payment notifications. No secrets in logs."""
import hashlib,hmac,re,time
from datetime import datetime
from decimal import Decimal,InvalidOperation

class PaymentRejected(ValueError): pass

def verify_signature(payment_id, request_id, signature, secret, now=None):
    if not secret or not re.fullmatch(r'[0-9]{1,30}',payment_id or '') or not request_id or len(request_id)>200:
        raise PaymentRejected('Invalid notification identity')
    parts={}
    for part in (signature or '').split(','):
        key,sep,value=part.strip().partition('=')
        if not sep or key in parts: raise PaymentRejected('Invalid signature format')
        parts[key]=value
    ts=parts.get('ts','');digest=parts.get('v1','')
    if not ts.isdigit() or len(ts) not in (10,13) or not re.fullmatch('[a-fA-F0-9]{64}',digest):
        raise PaymentRejected('Invalid signature format')
    timestamp=int(ts)/(1000 if len(ts)==13 else 1)
    if abs((time.time() if now is None else now)-timestamp)>600: raise PaymentRejected('Expired notification')
    manifest=f'id:{payment_id};request-id:{request_id};ts:{ts};'
    expected=hmac.new(secret.encode(),manifest.encode(),hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected,digest.lower()):raise PaymentRejected('Invalid signature')

def validate_payment(payment, order, payment_id, collector_id, production):
    if str(payment.get('id'))!=payment_id:raise PaymentRejected('Payment identity mismatch')
    if str(payment.get('collector_id'))!=str(collector_id):raise PaymentRejected('Seller mismatch')
    if payment.get('live_mode') is not production:raise PaymentRejected('Environment mismatch')
    if payment.get('external_reference')!=str(order['id']):raise PaymentRejected('Order mismatch')
    if payment.get('currency_id')!=order['currency']:raise PaymentRejected('Currency mismatch')
    try:
        amount=Decimal(str(payment.get('transaction_amount')))
        expected=Decimal(str(order['amount']))
        if not amount.is_finite() or amount<=0 or amount!=expected:raise PaymentRejected('Amount mismatch')
    except (InvalidOperation,TypeError):raise PaymentRejected('Invalid amount')
    if payment.get('status')!='approved':return None
    try:
        refunded=Decimal(str(payment.get('transaction_amount_refunded',0)))
        if not refunded.is_finite() or refunded!=0:raise PaymentRejected('Refund requires review')
    except (InvalidOperation,TypeError):raise PaymentRejected('Invalid refund amount')
    try:
        approved=datetime.fromisoformat(payment['date_approved'].replace('Z','+00:00'))
        if approved.tzinfo is None:raise ValueError()
    except (KeyError,TypeError,ValueError,AttributeError):raise PaymentRejected('Missing approval date')
    return approved
