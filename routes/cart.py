from flask import jsonify, request, Blueprint
from psycopg2.extras import RealDictCursor
from database import get_connection

cart = Blueprint('cart', __name__)

@cart.route('/')
def get_cart():
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT * FROM cart')
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(rows)

@cart.route('/', methods=['POST'])
def create_cart():
    data = request.get_json()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute('INSERT INTO cart (order_id, product_id, quantity, unit_price) VALUES (%s, %s, %s, %s)',
                 (data['order_id'], data['product_id'], data['quantity'], data['unit_price']))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'message': 'Cart Item Created'}), 201

@cart.route('/<int:id>', methods=['PUT'])
def update_cart(id):
    try:
        conn = get_connection()
        cur = conn.cursor()
        data = request.get_json()
        cur.execute("""
            UPDATE cart
                SET order_id = %s,
                    product_id = %s,
                    quantity = %s,
                    unit_price = %s
                WHERE cart_id = %s
        """, (data['order_id'], data['product_id'], data['quantity'], data['unit_price'], id))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        return jsonify({'message': f"{e}"}), 500
    else: 
        return jsonify({'message': "Object Updated"}), 201
    
@cart.route('/<int:id>', methods=['DELETE'])
def delete_cart(id):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            DELETE FROM cart
                WHERE cart_id = %s
        """, (id, ))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        return jsonify({'message': f"An unexpected error occured: {e}"}), 500
    else:
        return jsonify({'message': "Object Deleted"}), 201