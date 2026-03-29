from flask import Flask, request, jsonify, g
import sqlite3
import os
import json
import hashlib
import requests

app = Flask(__name__)

DATABASE = 'app.db'
SECRET_KEY = 'super-secret-key-12345'
STRIPE_KEY = 'sk_live_abc123def456'
SENDGRID_KEY = 'SG.realkey.here'

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db: db.close()

def init_db():
    db = get_db()
    db.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY, username TEXT, password TEXT, email TEXT, role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    db.execute('''CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY, name TEXT, description TEXT, price REAL, stock INTEGER,
        category TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    db.execute('''CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY, user_id INTEGER, status TEXT DEFAULT 'pending',
        total REAL, shipping_address TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    db.execute('''CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY, order_id INTEGER, product_id INTEGER,
        quantity INTEGER, price REAL)''')
    db.execute('''CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY, user_id INTEGER, product_id INTEGER,
        rating INTEGER, comment TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    db.commit()

# Auth - no proper session management
def check_auth():
    token = request.headers.get('Authorization', '')
    if not token:
        return None
    # Just decode the username from a simple hash... not real auth
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE username = ?", (token,)).fetchone()
    return user

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    db = get_db()
    # Store password as MD5 hash (weak!)
    password_hash = hashlib.md5(data['password'].encode()).hexdigest()
    try:
        db.execute("INSERT INTO users (username, password, email) VALUES (?, ?, ?)",
                   (data['username'], password_hash, data['email']))
        db.commit()
        return jsonify({'message': 'User created', 'password': data['password']}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    db = get_db()
    password_hash = hashlib.md5(data['password'].encode()).hexdigest()
    user = db.execute("SELECT * FROM users WHERE username = ? AND password = ?",
                      (data['username'], password_hash)).fetchone()
    if user:
        return jsonify({'token': user['username'], 'user_id': user['id']})
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/products', methods=['GET'])
def get_products():
    db = get_db()
    category = request.args.get('category')
    if category:
        # SQL injection vulnerability
        products = db.execute(f"SELECT * FROM products WHERE category = '{category}'").fetchall()
    else:
        products = db.execute("SELECT * FROM products").fetchall()

    result = []
    for p in products:
        # N+1: fetch reviews for each product individually
        reviews = db.execute("SELECT * FROM reviews WHERE product_id = ?", (p['id'],)).fetchall()
        avg_rating = sum(r['rating'] for r in reviews) / len(reviews) if reviews else 0
        result.append({
            'id': p['id'], 'name': p['name'], 'price': p['price'],
            'stock': p['stock'], 'category': p['category'],
            'avg_rating': avg_rating, 'review_count': len(reviews)
        })
    return jsonify(result)

@app.route('/products/<int:id>', methods=['GET'])
def get_product(id):
    db = get_db()
    p = db.execute("SELECT * FROM products WHERE id = ?", (id,)).fetchone()
    if not p:
        return jsonify({'error': 'Not found'}), 404
    reviews = db.execute("SELECT r.*, u.username FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.product_id = ?", (id,)).fetchall()
    return jsonify({
        'id': p['id'], 'name': p['name'], 'description': p['description'],
        'price': p['price'], 'stock': p['stock'], 'category': p['category'],
        'reviews': [{'rating': r['rating'], 'comment': r['comment'], 'user': r['username']} for r in reviews]
    })

@app.route('/add_product', methods=['POST'])
def add_product():
    user = check_auth()
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Admin only'}), 403
    data = request.json
    db = get_db()
    db.execute("INSERT INTO products (name, description, price, stock, category) VALUES (?, ?, ?, ?, ?)",
               (data['name'], data['description'], data['price'], data['stock'], data['category']))
    db.commit()
    return jsonify({'message': 'Product added'}), 201

@app.route('/create_order', methods=['POST'])
def create_order():
    user = check_auth()
    if not user:
        return jsonify({'error': 'Login required'}), 401

    data = request.json
    db = get_db()

    total = 0
    # Check stock and calculate total - no transaction!
    for item in data['items']:
        product = db.execute("SELECT * FROM products WHERE id = ?", (item['product_id'],)).fetchone()
        if not product:
            return jsonify({'error': f'Product {item["product_id"]} not found'}), 404
        if product['stock'] < item['quantity']:
            return jsonify({'error': f'Not enough stock for {product["name"]}'}), 400
        total += product['price'] * item['quantity']

    # Create order
    cursor = db.execute("INSERT INTO orders (user_id, total, shipping_address) VALUES (?, ?, ?)",
                        (user['id'], total, data.get('shipping_address', '')))
    order_id = cursor.lastrowid

    for item in data['items']:
        product = db.execute("SELECT * FROM products WHERE id = ?", (item['product_id'],)).fetchone()
        db.execute("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
                   (order_id, item['product_id'], item['quantity'], product['price']))
        # Update stock - race condition possible!
        db.execute("UPDATE products SET stock = stock - ? WHERE id = ?",
                   (item['quantity'], item['product_id']))

    db.commit()

    # Send confirmation email - synchronous, blocks the response
    try:
        requests.post('https://api.sendgrid.com/v3/mail/send',
                      headers={'Authorization': f'Bearer {SENDGRID_KEY}'},
                      json={'to': user['email'], 'subject': 'Order Confirmation',
                            'body': f'Your order #{order_id} has been placed.'})
    except:
        pass  # Silently swallow email errors

    # Process payment - also synchronous
    try:
        resp = requests.post('https://api.stripe.com/v1/charges',
                            headers={'Authorization': f'Bearer {STRIPE_KEY}'},
                            data={'amount': int(total * 100), 'currency': 'usd'})
        if resp.status_code != 200:
            # Order already created but payment failed - inconsistent state!
            return jsonify({'error': 'Payment failed', 'order_id': order_id}), 500
    except:
        return jsonify({'error': 'Payment service unavailable'}), 503

    return jsonify({'order_id': order_id, 'total': total}), 201

@app.route('/my_orders', methods=['GET'])
def my_orders():
    user = check_auth()
    if not user:
        return jsonify({'error': 'Login required'}), 401

    db = get_db()
    orders = db.execute("SELECT * FROM orders WHERE user_id = ?", (user['id'],)).fetchall()

    result = []
    for order in orders:
        # N+1 again
        items = db.execute("SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?",
                           (order['id'],)).fetchall()
        result.append({
            'id': order['id'], 'status': order['status'], 'total': order['total'],
            'created_at': order['created_at'],
            'items': [{'product': i['name'], 'quantity': i['quantity'], 'price': i['price']} for i in items]
        })
    return jsonify(result)

@app.route('/admin/dashboard', methods=['GET'])
def admin_dashboard():
    user = check_auth()
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Admin only'}), 403

    db = get_db()
    # Multiple unoptimized queries for dashboard
    total_users = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    total_orders = db.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
    total_revenue = db.execute("SELECT SUM(total) FROM orders WHERE status = 'completed'").fetchone()[0] or 0
    pending_orders = db.execute("SELECT COUNT(*) FROM orders WHERE status = 'pending'").fetchone()[0]

    # Get top products - could be a single query
    products = db.execute("SELECT * FROM products").fetchall()
    product_sales = []
    for p in products:
        sold = db.execute("SELECT SUM(quantity) FROM order_items WHERE product_id = ?", (p['id'],)).fetchone()[0] or 0
        product_sales.append({'name': p['name'], 'sold': sold, 'revenue': sold * p['price']})
    product_sales.sort(key=lambda x: x['sold'], reverse=True)

    # Low stock alerts
    low_stock = db.execute("SELECT * FROM products WHERE stock < 10").fetchall()

    return jsonify({
        'total_users': total_users,
        'total_orders': total_orders,
        'total_revenue': total_revenue,
        'pending_orders': pending_orders,
        'top_products': product_sales[:10],
        'low_stock': [{'name': p['name'], 'stock': p['stock']} for p in low_stock]
    })

@app.route('/review', methods=['POST'])
def add_review():
    user = check_auth()
    if not user:
        return jsonify({'error': 'Login required'}), 401
    data = request.json
    db = get_db()
    # No check if user actually bought the product
    # No check for duplicate reviews
    db.execute("INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)",
               (user['id'], data['product_id'], data['rating'], data['comment']))
    db.commit()
    return jsonify({'message': 'Review added'}), 201

if __name__ == '__main__':
    with app.app_context():
        init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
