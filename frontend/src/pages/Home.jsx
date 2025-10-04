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

// Helper function to get full image URL
function getImageUrl(filename) {
  if (!filename) return null;
  return `http://localhost:5000${filename.startsWith("/uploads/") ? filename : `/uploads/${filename}`}`;
}

export default function Home({ cart, setCart, siteDiscount }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bestPackages, setBestPackages] = useState([]);
  const [specialDeal, setSpecialDeal] = useState(null);
  const [timeLeft, setTimeLeft] = useState({});
  const navigate = useNavigate();

  // Initialize discount and special deal
  useEffect(() => {
    const discount = sessionStorage.getItem("siteDiscount") 
      ? parseInt(sessionStorage.getItem("siteDiscount"))
      : Math.floor(Math.random() * 21) + 10;
    sessionStorage.setItem("siteDiscount", discount);

    const dealTime = sessionStorage.getItem("specialDealEnd") 
      ? parseInt(sessionStorage.getItem("specialDealEnd"))
      : Date.now() + (Math.floor(Math.random() * (24 - 4 + 1) + 4) * 60 * 60 * 1000);
    setSpecialDeal(dealTime);
    sessionStorage.setItem("specialDealEnd", dealTime);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!specialDeal) return;
    const interval = setInterval(() => {
      const diff = specialDeal - Date.now();
      if (diff <= 0) clearInterval(interval);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    }, 1000);
    return () => clearInterval(interval);
  }, [specialDeal]);

  // Fetch products, categories, packages
  useEffect(() => {
    axios.get("http://localhost:5000/api/products")
      .then(res => setProducts(res.data.sort(() => 0.5 - Math.random())))
      .catch(err => console.error(err));

    axios.get("http://localhost:5000/api/products/categories-with-image")
      .then(res => setCategories(res.data))
      .catch(err => console.error(err));

    if (!sessionStorage.getItem("bestPackages")) {
      axios.get("http://localhost:5000/api/products/packages")
        .then(res => {
          const shuffled = res.data.sort(() => 0.5 - Math.random()).slice(0, 2);
          sessionStorage.setItem("bestPackages", JSON.stringify(shuffled));
          setBestPackages(shuffled);
        }).catch(err => console.error(err));
    } else {
      setBestPackages(JSON.parse(sessionStorage.getItem("bestPackages")));
    }
  }, []);

  // Add to Cart
  const handleAddToCart = (product) => {
    if (!cart) return;

    const index = cart.findIndex(item => item.productID === product.productID);

    if (index !== -1) {
      const updatedCart = [...cart];
      updatedCart[index].qty += 1;
      setCart(updatedCart);
    } else {
      const newItem = {
        productID: product.productID,
        name: product.productTitle,
        price: product.listPrice,
        qty: 1,
        stock: product.stock || 10,
        pic: product.productImage,
      };
      setCart([...cart, newItem]);
    }
  };

  const goToProduct = (productID) => {
    navigate(`/product/${productID}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="py-5 bg-light text-center hero-section">
        <h1>ENTIRE WEBSITE UP TO {siteDiscount}% OFF</h1>
        <a href="#products" className="btn btn-primary mt-3">Shop Now</a>
      </section>

      {/* Popular Products Slider 1 */}
      <section className="py-5" id="products">
        <div className="container">
          <h2 className="mb-4">Popular <span className="text-primary">Products</span></h2>
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={30}
            slidesPerView={3}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 3000 }}
            breakpoints={{ 0: { slidesPerView: 1 }, 768: { slidesPerView: 2 }, 992: { slidesPerView: 3 } }}
          >
            {products.slice(0, 6).map(product => (
              <SwiperSlide key={product.productID}>
                <div className="card h-100 product-card">
                  <div className="product-image-wrapper">
                    <img src={getImageUrl(product.productImage)} alt={product.productTitle} className="card-img-top" style={{ height: "250px", objectFit: "cover" }} />
                    <FaInfoCircle className="info-icon" onClick={() => goToProduct(product.productID)} title="View Product" />
                  </div>
                  <div className="card-body text-center">
                    <h5>{product.productTitle}</h5>
                    <p>
                      <span className="text-danger">${(product.listPrice * (1 - siteDiscount / 100)).toFixed(2)}</span>{" "}
                      <del>${product.listPrice}</del>
                    </p>
                    <button className="btn btn-primary" onClick={() => handleAddToCart(product)}>Add to Cart</button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <hr className="my-5" />

          {/* Popular Products Slider 2 */}
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={30}
            slidesPerView={3}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 3500 }}
            breakpoints={{ 0: { slidesPerView: 1 }, 768: { slidesPerView: 2 }, 992: { slidesPerView: 3 } }}
          >
            {products.slice(6, 12).map(product => (
              <SwiperSlide key={product.productID}>
                <div className="card h-100 product-card">
                  <div className="product-image-wrapper">
                    <img src={getImageUrl(product.productImage)} alt={product.productTitle} className="card-img-top" style={{ height: "250px", objectFit: "cover" }} />
                    <FaInfoCircle className="info-icon" onClick={() => goToProduct(product.productID)} title="View Product" />
                  </div>
                  <div className="card-body text-center">
                    <h5>{product.productTitle}</h5>
                    <p>
                      <span className="text-danger">${(product.listPrice * (1 - siteDiscount / 100)).toFixed(2)}</span>{" "}
                      <del>${product.listPrice}</del>
                    </p>
                    <button className="btn btn-primary" onClick={() => handleAddToCart(product)}>Add to Cart</button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* Best Packages */}
      <section className="py-5 bg-light" id="featured">
        <div className="container">
          <h2 className="mb-4"><span className="text-primary">Best</span> Packages</h2>
          <div className="row">
            {bestPackages.map((pkg, index) => (
              <div key={index} className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="d-grid gap-1" style={{ gridTemplateColumns: `repeat(${pkg.items.length}, 1fr)`, height: "250px", overflow: "hidden" }}>
                    {pkg.items.map((item, idx) => (
                      <img key={idx} src={getImageUrl(item.productImage)} alt={item.productTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ))}
                  </div>
                  <div className="card-body text-center">
                    <h5>{pkg.animeName} Bundle</h5>
                    <p>Includes: {pkg.items.map(i => i.productTitle).join(" + ")}</p>
                    <p>
                      <span className="text-danger">${(pkg.price * (1 - siteDiscount / 100)).toFixed(2)}</span>{" "}
                      <del>${pkg.original}</del> <span className="text-success">({pkg.discountPercent}% off)</span>
                    </p>
                    <button className="btn btn-primary" onClick={() => pkg.items.forEach(item => handleAddToCart(item))}>Add to Cart</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-5" id="categories">
        <div className="container">
          <h2 className="mb-4">Shop by <span className="text-primary">Category</span></h2>
          <div className="row">
            {categories.map(category => (
              <div key={category.categoryID} className="col-md-3 mb-4">
                <div className="card h-100 text-center">
                  <img src={getImageUrl(category.productImage)} alt={category.categoryName} className="card-img-top" style={{ height: "200px", objectFit: "cover" }} />
                  <div className="card-body">
                    <h5>{category.categoryName}</h5>
                    <a href={`/category/${category.categoryID}`} className="btn btn-primary mt-2">Shop Now</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Deal */}
      <section className="py-5 bg-light" id="deal">
        <div className="container text-center">
          <h2>Special <span className="text-primary">Deal</span></h2>
          <p className="lead">Up to {siteDiscount}% off - Deal of the Day</p>
          <div className="d-flex justify-content-center gap-3 mb-4">
            <div><h3>{timeLeft.hours || 0}</h3><span>Hours</span></div>
            <div><h3>{timeLeft.minutes || 0}</h3><span>Minutes</span></div>
            <div><h3>{timeLeft.seconds || 0}</h3><span>Seconds</span></div>
          </div>
          <a href="#products" className="btn btn-primary">Shop Now</a>
        </div>
      </section>

    </div>
  );
}
