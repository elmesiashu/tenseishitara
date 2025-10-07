import React, { useEffect, useState } from "react";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper";
import { FaInfoCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Dynamic API base (works both locally and on Vercel)
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Get image path
function getImageUrl(filename) {
  if (!filename || typeof filename !== "string" || filename.trim() === "") {
    return "/images/placeholder.png";
  }
  if (filename.startsWith("http")) return filename;
  if (filename.startsWith("/api/uploads/")) {
    return `${API_BASE}${filename.replace("/api", "")}`;
  }
  if (filename.startsWith("/uploads/")) {
    return `${API_BASE}${filename}`;
  }
  return `${API_BASE}/uploads/${filename}`;
}

export default function Home({ user, cart, setCart, addToCart, siteDiscount }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bestPackages, setBestPackages] = useState([]);
  const [specialDeal, setSpecialDeal] = useState(null);
  const [timeLeft, setTimeLeft] = useState({});
  const navigate = useNavigate();

  // Random site-wide discount
  useEffect(() => {
    const discount = sessionStorage.getItem("siteDiscount")
      ? parseInt(sessionStorage.getItem("siteDiscount"))
      : Math.floor(Math.random() * 21) + 10;
    sessionStorage.setItem("siteDiscount", discount);

    const dealTime = sessionStorage.getItem("specialDealEnd")
      ? parseInt(sessionStorage.getItem("specialDealEnd"))
      : Date.now() + Math.floor(Math.random() * (24 - 4 + 1) + 4) * 60 * 60 * 1000;

    setSpecialDeal(dealTime);
    sessionStorage.setItem("specialDealEnd", dealTime);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!specialDeal) return;
    const interval = setInterval(() => {
      const diff = specialDeal - Date.now();
      if (diff <= 0) clearInterval(interval);
      setTimeLeft({
        hours: Math.max(0, Math.floor(diff / (1000 * 60 * 60))),
        minutes: Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))),
        seconds: Math.max(0, Math.floor((diff % (1000 * 60)) / 1000)),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [specialDeal]);

  // Fetch data
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/products`)
      .then((res) => setProducts(res.data.sort(() => 0.5 - Math.random())))
      .catch((err) => console.error("Error fetching products:", err));

    axios
      .get(`${API_BASE}/api/products/categories-with-image`)
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Error fetching categories:", err));

    if (!sessionStorage.getItem("bestPackages")) {
      axios
        .get(`${API_BASE}/api/products/packages`)
        .then((res) => {
          const shuffled = res.data.sort(() => 0.5 - Math.random()).slice(0, 2);
          sessionStorage.setItem("bestPackages", JSON.stringify(shuffled));
          setBestPackages(shuffled);
        })
        .catch((err) => console.error("Error fetching packages:", err));
    } else {
      setBestPackages(JSON.parse(sessionStorage.getItem("bestPackages")));
    }
  }, []);

  // Navigation helpers
  const goToProduct = (id) => navigate(`/product/${id}`);

  const handleAddToCart = (product) => {
    const cartItem = {
      id: product.productID,
      name: product.productTitle,
      price: parseFloat(product.listPrice) || 0,
      qty: 1,
      stock: product.stock || 10,
      pic: product.productImage,
      optionKey: "default",
    };
    addToCart(cartItem);
  };

  const handleShopNow = (categoryID) => {
    navigate(`/category/${categoryID}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="py-5 bg-light text-center hero-section">
        <h1>ENTIRE WEBSITE UP TO {siteDiscount}% OFF</h1>
        <button
          className="btn btn-primary mt-3"
          onClick={() =>
            categories.length > 0
              ? handleShopNow(categories[0].categoryID)
              : navigate("")
          }
        >
          Shop Now
        </button>
      </section>

      {/* Popular Products */}
      <section className="py-5" id="products">
        <div className="container">
          <h2 className="mb-4">
            Popular <span className="text-primary">Products</span>
          </h2>

          {[0, 6].map((start, index) => (
            <React.Fragment key={index}>
              {index === 1 && <hr className="my-5" />}
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={30}
                slidesPerView={3}
                navigation
                pagination={{ clickable: true }}
                autoplay={{ delay: 3000 + index * 500 }}
                breakpoints={{
                  0: { slidesPerView: 1 },
                  768: { slidesPerView: 2 },
                  992: { slidesPerView: 3 },
                }}
              >
                {products.slice(start, start + 6).map((product) => (
                  <SwiperSlide key={product.productID}>
                    <div className="card h-100 product-card">
                      <div className="product-image-wrapper position-relative">
                        <img
                          src={getImageUrl(product.productImage)}
                          alt={product.productTitle}
                          className="card-img-top"
                          style={{ height: "250px", objectFit: "cover" }}
                          onError={(e) =>
                            (e.currentTarget.src = "/images/placeholder.png")
                          }
                        />
                        <FaInfoCircle
                          className="info-icon"
                          onClick={() => goToProduct(product.productID)}
                          title="View Product"
                          style={{ cursor: "pointer", fontSize: "1.5rem" }}
                        />
                      </div>
                      <div className="card-body text-center">
                        <h5>{product.productTitle}</h5>
                        <p>
                          <span className="text-danger">
                            $
                            {(
                              product.listPrice *
                              (1 - siteDiscount / 100)
                            ).toFixed(2)}
                          </span>{" "}
                          <del>${product.listPrice}</del>
                        </p>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleAddToCart(product)}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Best Packages */}
      <section className="py-5 bg-light" id="featured">
        <div className="container">
          <h2 className="mb-4">
            <span className="text-primary">Best</span> Packages
          </h2>

          {bestPackages.length === 0 ? (
            <p className="text-center text-muted">No packages available.</p>
          ) : (
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={30}
              slidesPerView={2}
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 4000 }}
              breakpoints={{
                0: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
              }}
            >
              {bestPackages.map((pkg) => (
                <SwiperSlide key={pkg.animeID}>
                  <div className="card h-100 shadow-sm">
                    {/* Bundle Image Grid */}
                    <div
                      className="package-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${Math.min(pkg.items.length, 3)}, 1fr)`,
                        height: "250px",
                        overflow: "hidden",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      {pkg.items.map((item, idx) => (
                        <img
                          key={item.productID || idx}
                          src={getImageUrl(item.productImage)}
                          alt={item.productTitle}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={(e) =>
                            (e.currentTarget.src = "/images/placeholder.png")
                          }
                        />
                      ))}
                    </div>

                    {/* Bundle Info */}
                    <div className="card-body text-center">
                      <h5 className="fw-bold mb-2">{pkg.animeName} Bundle</h5>
                      <p className="small text-muted mb-2">
                        Includes: {pkg.items.map((i) => i.productTitle).join(" + ")}
                      </p>
                      <p className="mb-3">
                        <span className="text-danger fw-bold">
                          ${(pkg.price * (1 - siteDiscount / 100)).toFixed(2)}
                        </span>{" "}
                        <del>${pkg.original.toFixed(2)}</del>{" "}
                        <span className="text-success">
                          ({pkg.discountPercent}% off)
                        </span>
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={() =>
                          pkg.items.forEach((item) => handleAddToCart(item))
                        }
                      >
                        Add Entire Bundle
                      </button>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-5" id="categories">
        <div className="container">
          <h2 className="mb-4">
            Shop by <span className="text-primary">Category</span>
          </h2>
          <div className="row">
            {categories.length === 0 ? (
              <p className="text-center text-muted">No categories available.</p>
            ) : (
              categories.map((category) => (
                <div key={category.categoryID} className="col-md-3 mb-4">
                  <div
                    className="card h-100 text-center shadow-sm"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/category/${category.categoryID}`)}
                  >
                    <img
                      src={getImageUrl(category.productImage)}
                      alt={category.categoryName}
                      className="card-img-top"
                      style={{ height: "200px", objectFit: "cover" }}
                      onError={(e) =>
                        (e.currentTarget.src = "/images/placeholder.png")
                      }
                    />
                    <div className="card-body">
                      <h5 className="card-title">{category.categoryName}</h5>
                      <button
                        className="btn btn-primary mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/category/${category.categoryID}`);
                        }}
                      >
                        Shop Now
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Special Deal */}
      <section className="py-5 bg-light" id="deal">
        <div className="container text-center">
          <h2>
            Special <span className="text-primary">Deal</span>
          </h2>
          <p className="lead">Up to {siteDiscount}% off - Deal of the Day</p>
          <div className="d-flex justify-content-center gap-3 mb-4">
            <div>
              <h3>{timeLeft.hours || 0}</h3>
              <span>Hours</span>
            </div>
            <div>
              <h3>{timeLeft.minutes || 0}</h3>
              <span>Minutes</span>
            </div>
            <div>
              <h3>{timeLeft.seconds || 0}</h3>
              <span>Seconds</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
