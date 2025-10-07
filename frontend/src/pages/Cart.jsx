import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [siteDiscount, setSiteDiscount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(storedCart);

    // Fetch discount if your backend provides one
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/discount`)
      .then((res) => setSiteDiscount(res.data.discount || 0))
      .catch(() => setSiteDiscount(0));
  }, []);

  const handleQuantityChange = (id, qty) => {
    const updatedCart = cart.map((item) =>
      item.id === id ? { ...item, qty: Math.max(1, Number(qty)) } : item
    );
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const handleRemove = (id) => {
    const updatedCart = cart.filter((item) => item.id !== id);
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const handleCheckout = () => {
    const checkoutData = cart.map((item) => {
      const price = Number(item.price) || 0;
      const discountedPrice = price * (1 - (Number(siteDiscount) || 0) / 100);
      return {
        ...item,
        price: discountedPrice,
      };
    });

    // ✅ Save to sessionStorage for checkout
    sessionStorage.setItem("checkoutCart", JSON.stringify(checkoutData));

    navigate("/checkout");
  };

  const subtotal = cart.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const discounted = price * (1 - (Number(siteDiscount) || 0) / 100);
    return sum + discounted * (item.qty || 1);
  }, 0);

  return (
    <div className="cart-page container py-5">
      <h2 className="mb-4">Your Cart</h2>

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => {
                const price = Number(item.price) || 0;
                const discounted = price * (1 - (Number(siteDiscount) || 0) / 100);
                const total = discounted * (item.qty || 1);
                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>
                      <input
                        type="number"
                        value={item.qty}
                        min="1"
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        style={{ width: "70px" }}
                      />
                    </td>
                    <td>${discounted.toFixed(2)}</td>
                    <td>${total.toFixed(2)}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemove(item.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="d-flex justify-content-between mt-4">
            <h4>Subtotal: ${subtotal.toFixed(2)}</h4>
            <button className="btn btn-primary" onClick={handleCheckout}>
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
