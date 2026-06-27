import { Link } from "react-router-dom";
import { BookOpen, Laptop, Sofa, Home as HomeIcon } from "lucide-react";
import Navbar from "../components/Navbar";

const categories = [
  { name: "Textbooks", description: "Browse available books", icon: BookOpen },
  { name: "Electronics", description: "Laptops, monitors, devices", icon: Laptop },
  { name: "Furniture", description: "Chairs, desks, storage", icon: Sofa },
  { name: "Room Essentials", description: "Dorm and apartment items", icon: HomeIcon },
];

const featuredListings = [
  {
    id: "demo-1",
    title: "Used Psychology Textbook",
    price: 45,
    condition: "Used - Good",
    seller: "Aisha M.",
    time: "2 days ago",
    image:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop",
  },
  {
    id: "demo-2",
    title: "Mini Fridge",
    price: 80,
    condition: "Like New",
    seller: "Marcus P.",
    time: "1 week ago",
    image:
      "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&auto=format&fit=crop",
  },
  {
    id: "demo-3",
    title: "Black LED Desk Lamp",
    price: 18,
    condition: "Used - Good",
    seller: "Emma L.",
    time: "3 days ago",
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop",
  },
  {
    id: "demo-4",
    title: "Office Chair",
    price: 60,
    condition: "Used",
    seller: "David K.",
    time: "5 days ago",
    image:
      "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&auto=format&fit=crop",
  },
];

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="home-page">
        <section className="hero">
          <h1>Buy and sell campus essentials with students near you</h1>
          <p>
            Find textbooks, furniture, electronics, and everyday items within
            your university community.
          </p>

          <div className="hero-actions">
            <Link to="/listings" className="primary-button">
              Browse Listings
            </Link>
            <Link to="/sell" className="secondary-button">
              Sell an Item
            </Link>
          </div>

          <Link to="/listings" className="hero-search">
            Search textbooks, furniture, electronics...
          </Link>
        </section>

        <section className="section">
          <h2>Browse by Category</h2>
          <div className="category-grid">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <Link to="/listings" className="category-card" key={category.name}>
                  <div className="category-icon">
                    <Icon size={24} />
                  </div>
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <h2>Featured Listings</h2>
            <Link to="/listings">View all</Link>
          </div>

          <div className="listing-grid">
            {featuredListings.map((listing) => (
              <Link to="/listings/demo" className="listing-card" key={listing.id}>
                <img src={listing.image} alt={listing.title} />
                <div className="listing-card-body">
                  <h3>{listing.title}</h3>
                  <div className="listing-row">
                    <strong>${listing.price}</strong>
                    <span>{listing.condition}</span>
                  </div>
                  <div className="listing-meta">
                    <span>{listing.seller}</span>
                    <span>{listing.time}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>© 2026 CampusCart. Built for university students.</p>
      </footer>
    </>
  );
}