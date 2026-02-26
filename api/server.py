"""
Petal Rush — Python Backend (api/server.py)
Optional server for webhooks, cron jobs, email
Run: python server.py
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json, os, urllib.request
from datetime import datetime, timezone

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
PORT = int(os.environ.get('PORT', 8000))

def sb(method, path, data=None, params=''):
    url = f"{SUPABASE_URL}/rest/v1/{path}{params}"
    headers = {'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}',
               'Content-Type': 'application/json', 'Prefer': 'return=representation'}
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"  ⚠ Supabase {method} {path}: {e}")
        return None

def notify(user_id, title, msg):
    sb('POST', 'notifications', {'user_id': user_id, 'title': title, 'message': msg})

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *a): print(f"[{datetime.now():%H:%M:%S}] {fmt%a}")
    def send_json(self, data, code=200):
        self.send_response(code)
        self.send_header('Content-Type','application/json')
        self.send_header('Access-Control-Allow-Origin','*')
        self.send_header('Access-Control-Allow-Methods','GET,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers','Content-Type,Authorization')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    def read_body(self):
        n = int(self.headers.get('Content-Length', 0))
        try: return json.loads(self.rfile.read(n)) if n else {}
        except: return {}
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin','*')
        self.send_header('Access-Control-Allow-Methods','GET,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers','Content-Type,Authorization')
        self.end_headers()

    def do_GET(self):
        p = self.path.split('?')[0]
        if p == '/health':
            self.send_json({'status':'ok','ts':datetime.now().isoformat()})

        elif p == '/api/expire-products':
            now = datetime.now(timezone.utc).isoformat()
            expired = sb('GET', f'products?is_active=eq.true&auto_expire_at=lt.{now}') or []
            for prod in expired:
                sb('PATCH', f'products?id=eq.{prod["id"]}', {'is_active': False})
            self.send_json({'expired': len(expired)})

        elif p == '/api/stats':
            users = sb('GET','users?select=role') or []
            orders = sb('GET','orders?select=order_status,total_amount') or []
            payments = sb('GET','payments?select=status,amount') or []
            wallet = sum(float(x.get('amount',0)) for x in payments if x.get('status')=='admin_wallet')
            self.send_json({
                'users': len(users),
                'sellers': sum(1 for u in users if u.get('role')=='seller'),
                'orders': len(orders),
                'pending': sum(1 for o in orders if o.get('order_status')=='placed'),
                'revenue': sum(float(o.get('total_amount',0)) for o in orders),
                'admin_wallet': wallet,
            })
        else:
            self.send_json({'error':'Not found'},404)

    def do_POST(self):
        p = self.path.split('?')[0]
        d = self.read_body()

        if p == '/api/payment/webhook':
            order_id = d.get('order_id')
            status   = d.get('status')
            if order_id and status == 'captured':
                sb('PATCH', f'payments?order_id=eq.{order_id}', {
                    'status':'admin_wallet', 'transaction_id': d.get('payment_id','')})
                sb('PATCH', f'orders?id=eq.{order_id}', {'payment_status':'paid'})
                # Notify seller
                orders = sb('GET', f'orders?id=eq.{order_id}') or []
                if orders: notify(orders[0]['seller_id'], 'New Order! 🛒', f'Order {order_id[:8]} payment received.')
                self.send_json({'ok':True})
            else:
                self.send_json({'error':'Invalid webhook'},400)

        elif p == '/api/release-payment':
            pid = d.get('payment_id') or d.get('order_id')
            if not pid: self.send_json({'error':'payment_id required'},400); return
            field = 'id' if d.get('payment_id') else 'order_id'
            sb('PATCH', f'payments?{field}=eq.{pid}', {'status':'released'})
            self.send_json({'ok':True,'released':pid})

        elif p == '/api/assign-delivery':
            order_id   = d.get('order_id')
            partner_id = d.get('partner_id')
            if not order_id or not partner_id: self.send_json({'error':'Missing fields'},400); return
            sb('PATCH', f'orders?id=eq.{order_id}', {'delivery_partner_id':partner_id,'order_status':'assigned'})
            notify(partner_id, 'New Delivery! 🚚', f'Order #{order_id[:8]} assigned to you.')
            self.send_json({'ok':True})

        else:
            self.send_json({'error':'Not found'},404)

if __name__ == '__main__':
    print(f"""
  ╔═══════════════════════════════════════╗
  ║   🌸 Petal Rush API  :{PORT}            ║
  ╠═══════════════════════════════════════╣
  ║  GET  /health                         ║
  ║  GET  /api/stats                      ║
  ║  GET  /api/expire-products            ║
  ║  POST /api/payment/webhook            ║
  ║  POST /api/release-payment            ║
  ║  POST /api/assign-delivery            ║
  ╚═══════════════════════════════════════╝
    """)
    if not SUPABASE_URL: print("  ⚠ Set SUPABASE_URL + SUPABASE_SERVICE_KEY env vars\n")
    HTTPServer(('0.0.0.0', PORT), Handler).serve_forever()
