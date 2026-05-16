import { Link } from 'react-router-dom';

const sections = [
  { to: '/products', icon: '📦', title: 'Products', desc: 'Manage your product catalog' },
  { to: '/customers', icon: '👤', title: 'Customers', desc: 'View and manage customers' },
  { to: '/orders', icon: '🧾', title: 'Orders', desc: 'Track and update orders' },
  { to: '/cart', icon: '🛒', title: 'Cart', desc: 'View cart items across orders' },
];

export default function Home() {
  return (
    <div className="page-container">
      <div className="home-hero">
        <h1>Welcome to ShopApp</h1>
        <p>Manage your store — products, customers, orders, and cart items all in one place.</p>
        <div className="home-cards">
          {sections.map(({ to, icon, title, desc }) => (
            <Link key={to} to={to} className="home-card">
              <span className="home-card-icon">{icon}</span>
              <h2>{title}</h2>
              <p>{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
