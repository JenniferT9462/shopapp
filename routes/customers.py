from flask import jsonify, request, Blueprint
from psycopg2.extras import RealDictCursor
from database import get_connection

customers = Blueprint('customers', __name__)

@customers.route('/')
def get_customers():
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT * FROM customers')
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(rows)

@customers.route('/', methods=['POST'])
def create_customer():
    data = request.get_json()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute('INSERT INTO customers (name, email, phone, address) VALUES (%s, %s, %s, %s)',
                 (data['name'], data['email'], data['phone'], data['address']))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'message': 'Customer Created'}), 201

@customers.route('/<int:id>', methods=['PUT'])
def update_customer(id):
    try:
        conn = get_connection()
        cur = conn.cursor()
        data = request.get_json()
        cur.execute("""
            UPDATE customers
                SET name = %s,
                    email = %s,
                    phone = %s,
                    address = %s
                WHERE customer_id = %s
        """, (data['name'], data['email'], data['phone'], data['address'], id))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        return jsonify({'message': f"{e}"}), 500
    else: 
        return jsonify({'message': "Object Updated"}), 201
    
@customers.route('/<int:id>', methods=['DELETE'])
def delete_customer(id):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            DELETE FROM customers
                WHERE customer_id = %s
        """, (id, ))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        return jsonify({'message': f"An unexpected error occured: {e}"}), 500
    else:
        return jsonify({'message': "Object Deleted"}), 201