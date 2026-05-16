from flask import jsonify, request, Blueprint
from psycopg2.extras import RealDictCursor
from database import get_connection

products = Blueprint('products', __name__)

@products.route('/')
def get_products():
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT * FROM products')
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(rows)

@products.route('/', methods=['POST'])
def create_product():
    data = request.get_json()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute('INSERT INTO products (name, description, price, stock_quantity) VALUES (%s, %s, %s, %s)',
                 (data['name'], data['description'], data['price'], data['stock_quantity']))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'message': 'Product Created'}), 201

@products.route('/<int:id>', methods=['PUT'])
def update_product(id):
    try:
        conn = get_connection()
        cur = conn.cursor()
        data = request.get_json()
        cur.execute("""
            UPDATE products
                SET name = %s,
                    description = %s,
                    price = %s,
                    stock_quantity = %s
                WHERE product_id = %s
        """, (data['name'], data['description'], data['price'], data['stock_quantity'], id))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        return jsonify({'message': f"{e}"}), 500
    else: 
        return jsonify({'message': "Object Updated"}), 201
    
@products.route('/<int:id>', methods=['DELETE'])
def delete_product(id):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            DELETE FROM products
                WHERE product_id = %s
        """, (id, ))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        return jsonify({'message': f"An unexpected error occured: {e}"}), 500
    else:
        return jsonify({'message': "Object Deleted"}), 201