import React, { useEffect, useRef, useState } from "react";
import { Table, Card, Row, Col, Spinner } from "react-bootstrap";
import Chart from "chart.js/auto";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const [admin, setAdmin] = useState({});
  const [products, setProducts] = useState([]);
  const [totalStock, setTotalStock] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Redirect non-admin users
  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (!user.isAdmin) {
      navigate("/", { replace: true });
      return;
    }
  }, [user, navigate]);

  // Fetch dashboard data
  useEffect(() => {
    if (!user?._id || !user.isAdmin) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [adminRes, productRes, ordersRes] = await Promise.all([
          axios.get(`${API}/api/dashboard/admin/${user._id}`, {
            withCredentials: true,
          }),
          axios.get(`${API}/api/dashboard/product-stats`, {
            withCredentials: true,
          }),
          axios.get(`${API}/api/dashboard/orders`, {
            withCredentials: true,
          }),
        ]);

        setAdmin(adminRes.data || {});
        setProducts(productRes.data?.categories || []);
        setTotalStock(productRes.data?.total || 0);
        setOrders(ordersRes.data || []);

        renderChart(productRes.data?.categories || []);
      } catch (err) {
        console.error("❌ Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, API]);

  // Render / Update Chart.js
  const renderChart = (data) => {
    if (!chartRef.current) return;

    // Destroy old chart before re-rendering
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: "bar",
      data: {
        labels: data.map((d) => d.categoryName || `Category ${d.categoryID}`),
        datasets: [
          {
            label: "Stock",
            data: data.map((d) => d.stock),
            backgroundColor: "#04AA6D",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2>
        Welcome, {admin?.fname || user?.fname || "Admin"}{" "}
        {admin?.lname || user?.lname || ""}
      </h2>

      {/* Chart + Stats */}
      <Row className="my-4">
        <Col md={8}>
          <canvas ref={chartRef}></canvas>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header>Product Stats</Card.Header>
            <Card.Body>
              {products.length > 0 ? (
                products.map((p) => (
                  <p key={p.categoryID}>
                    {p.categoryName || `Category ${p.categoryID}`}:{" "}
                    {((p.stock / totalStock) * 100).toFixed(1)}%
                  </p>
                ))
              ) : (
                <p>No category data available.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Orders Table */}
      <h3>Customer Orders</h3>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Order ID</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 ? (
            orders.map((o, i) => (
              <tr key={o.orderID || i}>
                <td>{o.fname} {o.lname}</td>
                <td>{o.orderID}</td>
                <td>{o.product}</td>
                <td>{o.quantity}</td>
                <td>${o.price?.toFixed(2)}</td>
                <td>${(o.price * o.quantity).toFixed(2)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center">
                No orders found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
