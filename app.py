from flask import Flask, render_template
from flask_cors import CORS
from database import init_db
from routes.products import products
from routes.customers import customers
from routes.cart import cart
from routes.orders import orders

init_db()
app=Flask(__name__)
CORS(app)

app.register_blueprint(products, url_prefix="/products")
app.register_blueprint(customers, url_prefix="/customers")
app.register_blueprint(cart, url_prefix="/cart")
app.register_blueprint(orders, url_prefix="/orders")

# Catch all route - required for React Router
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)