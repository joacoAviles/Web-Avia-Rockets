import hashlib,hmac,unittest
from mercadopago_validation import verify_signature,validate_payment,PaymentRejected
class Validation(unittest.TestCase):
 def signature(self,ts='1793232000'):
  return 'ts='+ts+',v1='+hmac.new(b'test-only',f'id:123;request-id:req;ts:{ts};'.encode(),hashlib.sha256).hexdigest()
 def test_valid_seconds_and_milliseconds(self):
  for ts in ['1793232000','1793232000000']:verify_signature('123','req',self.signature(ts),'test-only',now=1793232000)
 def test_tamper_and_expiry(self):
  for pid,req,now in [('124','req',1793232000),('123','other',1793232000),('123','req',1793232900)]:
   with self.assertRaises(PaymentRejected):verify_signature(pid,req,self.signature(),'test-only',now=now)
 def test_missing_and_duplicate_signature(self):
  for sig in ['',self.signature()+',ts=1793232000','ts=no,v1=x']:
   with self.assertRaises(PaymentRejected):verify_signature('123','req',sig,'test-only',now=1793232000)
 def fixture(self):
  return {'id':123,'collector_id':7,'live_mode':True,'external_reference':'order','currency_id':'CLP','transaction_amount':18990,'status':'approved','date_approved':'2026-10-29T10:00:00Z'}, {'id':'order','currency':'CLP','amount':18990}
 def test_approved(self):
  p,o=self.fixture();self.assertIsNotNone(validate_payment(p,o,'123','7',True))
 def test_pending_is_not_payment(self):
  p,o=self.fixture();p['status']='pending';self.assertIsNone(validate_payment(p,o,'123','7',True))
 def test_identity_price_environment_and_refunds(self):
  for key,value in [('id',124),('collector_id',8),('live_mode',False),('external_reference','other'),('currency_id','USD'),('transaction_amount',1),('transaction_amount','NaN'),('transaction_amount_refunded',1),('date_approved',None)]:
   p,o=self.fixture();p[key]=value
   with self.subTest(key=key),self.assertRaises(PaymentRejected):validate_payment(p,o,'123','7',True)
if __name__=='__main__':unittest.main()
