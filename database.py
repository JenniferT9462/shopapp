import psycopg2, os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST'),
        port=os.getenv('DB_PORT'),
        dbname=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        sslmode=os.getenv('DB_SSLMODE'),
    )
def init_db():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS customers (
            customer_id SERIAL PRIMARY KEY,
            name        VARCHAR(100) NOT NULL,
            email       VARCHAR(150) UNIQUE NOT NULL,
            phone       VARCHAR(20),
            address     TEXT,
            created_at  TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS products (
            product_id     SERIAL PRIMARY KEY,
            name           VARCHAR(200) NOT NULL,
            description    TEXT,
            price          NUMERIC(10, 2) NOT NULL,
            stock_quantity INTEGER DEFAULT 0,
            created_at     TIMESTAMP DEFAULT NOW()
        );
    
        CREATE TABLE IF NOT EXISTS orders (
            order_id     SERIAL PRIMARY KEY,
            customer_id  INTEGER REFERENCES customers(customer_id),
            order_date   TIMESTAMP DEFAULT NOW(),
            status       VARCHAR(50) DEFAULT 'pending',
            total_amount NUMERIC(10, 2)
        );
    
    
        CREATE TABLE IF NOT EXISTS cart (
            cart_id SERIAL PRIMARY KEY,
            order_id      INTEGER REFERENCES orders(order_id),
            product_id    INTEGER REFERENCES products(product_id),
            quantity      INTEGER NOT NULL,
            unit_price    NUMERIC(10, 2) NOT NULL
        );
    """)
    conn.commit()
    cur.close()
    conn.close()
    print("Database is ready!")