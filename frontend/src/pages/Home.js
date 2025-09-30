import React, { useEffect, useState } from "react";

export default function Home() {
  const [products, setProducts] = useState([]);
  const discount = 0.3;

  // Fetch products from Express backend
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
        <div className="navbar-brand d-flex align-items-center">
          <img
            src="/images/user-img.png"
            alt="User"
            className="rounded-circle me-2"
            width="40"
          />
          <h5 className="mb-0 text-light">User Name</h5>
        </div>
        <div className="ms-auto">
          <a href="/" className="nav-link text-light">
            Home
          </a>
          <a href="#products" className="nav-link text-light">
            Popular Anime
          </a>
          <a href="#featured" className="nav-link text-light">
            Best Package
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="home-section d-flex justify-content-between align-items-center p-5">
        <div className="content">
          <span className="badge bg-warning text-dark">Special Offer</span>
          <h2 className="fw-bold">ENTIRE WEBSITE UP TO 30% OFF</h2>
          <a href="/shop" className="btn btn-primary mt-3">
            Shop Now
          </a>
        </div>
        <div className="image">
          <img src="/images/img/gonrun.png" alt="gon" className="img-fluid" />
        </div>
      </section>

      {/* Product Section */}
      <section id="products" className="p-5">
        <h2 className="text-center mb-4">
          Popular <span className="text-primary">Products</span>
        </h2>
        <div className="row">
          {products.map((p) => (
            <div key={p.productID} className="col-md-4 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="position-absolute top-0 end-0 p-2">
                  <i className="fas fa-heart me-2"></i>
                  <i className="fas fa-search me-2"></i>
                  <i className="fas fa-eye"></i>
                </div>
                <img
                  src={`/images/productImage/${p.productImage}`}
                  className="card-img-top"
                  alt={p.productTitle}
                />
                <div className="card-body">
                  <h6 className="text-muted">{p.categoryName}</h6>
                  <h5>{p.productTitle}</h5>
                  <div className="stars text-warning mb-2">
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="far fa-star"></i>
                    <span className="text-muted ms-2">(250 reviews)</span>
                  </div>
                  <h6 className="fw-bold">
                    ${ (p.listPrice * (1 - discount)).toFixed(2) }{" "}
                    <span className="text-decoration-line-through text-muted ms-2">
                      ${p.listPrice}
                    </span>
                  </h6>
                  <button className="btn btn-primary mt-2">Add to Cart</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Section */}
      <section id="featured" className="p-5 bg-light">
        <h2 className="text-center mb-4">
          <span className="text-primary">Best</span> Package
        </h2>
        <div className="row">
          <div className="col-md-6">
            <div className="card shadow-sm">
              <img
                src="/images/img/p-2.png"
                className="card-img-top"
                alt="High Rise Invasion"
              />
              <div className="card-body">
                <h5>High Rise Invasion Package</h5>
                <p>
                  Includes 1 Sniper Mask + 1 random light figure + Anime +
                  Manga
                </p>
                <h6>
                  $89.99{" "}
                  <span className="text-muted text-decoration-line-through">
                    $110.99
                  </span>
                </h6>
                <button className="btn btn-primary">Add to Cart</button>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card shadow-sm">
              <img
                src="/images/img/p-5.png"
                className="card-img-top"
                alt="Demon Slayer"
              />
              <div className="card-body">
                <h5>Demon Slayer Package</h5>
                <p>
                  Includes Nezuko cosplay outfit + Tanjiro Figure + Anime +
                  Manga
                </p>
                <h6>
                  $99.99{" "}
                  <span className="text-muted text-decoration-line-through">
                    $120.99
                  </span>
                </h6>
                <button className="btn btn-primary">Add to Cart</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deal Section */}
      <section id="deal" className="p-5">
        <h2 className="text-center mb-4">
          Special <span className="text-primary">Deal</span>
        </h2>
        <div className="row align-items-center">
          <div className="col-md-6">
            <span className="badge bg-danger">Up to 30% Off</span>
            <h3>Deal of the Day</h3>
            <p>Don’t miss out on today’s exclusive offer.</p>
            <a href="/products" className="btn btn-primary">
              Shop Now
            </a>
          </div>
          <div className="col-md-6">
            <img
              src="/images/counter-img.png"
              alt="Deal"
              className="img-fluid"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
