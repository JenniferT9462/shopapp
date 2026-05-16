from flask import jsonify, request, Blueprint
from psycopg2.extras import RealDictCursor
from database import get_connection

orders = Blueprint('orders', __name__)

@orders.route('/')
def get_orders():
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT * FROM orders')
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(rows)

@orders.route('/', methods=['POST'])
def create_order():
    data = request.get_json()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute('INSERT INTO orders (customer_id, order_date, status, total_amount) VALUES (%s, %s, %s, %s)',
                 (data['customer_id'], data['order_date'], data['status'], data['total_amount']))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'message': 'Order Created'}), 201

@orders.route('/<int:id>', methods=['PUT'])
def update_order(id):
    try:
        conn = get_connection()
        cur = conn.cursor()
        data = request.get_json()
        cur.execute("""
            UPDATE orders
                SET customer_id = %s,
                    order_date = %s,
                    status = %s,
                    total_amount = %s
                WHERE order_id = %s
        """, (data['customer_id'], data['order_date'], data['status'], data['total_amount'], id))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        return jsonify({'message': f"{e}"}), 500
    else: 
        return jsonify({'message': "Object Updated"}), 201
    
@orders.route('/<int:id>', methods=['DELETE'])
def delete_order(id):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            DELETE FROM orders
                WHERE order_id = %s
        """, (id, ))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        return jsonify({'message': f"An unexpected error occured: {e}"}), 500
    else:
        return jsonify({'message': "Object Deleted"}), 201