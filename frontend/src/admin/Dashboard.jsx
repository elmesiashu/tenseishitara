import React, { useEffect, useRef, useState } from 'react';
import { Table, Card, Row, Col } from 'react-bootstrap';
import Chart from 'chart.js/auto';
import API from '../services/api'; 

// Styles
import "../css/admin.css";

export default function Dashboard({ user }) {
  const [admin, setAdmin] = useState({});
  const [products, setProducts] = useState([]);
  const [totalStock, setTotalStock] = useState(0);
  const [orders, setOrders] = useState([]);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!user?._id) return;

    const fetchData = async () => {
      try {
        const adminRes = await API.get(`/dashboard/admin/${user._id}`);
        setAdmin(adminRes.data);

        const productRes = await API.get('/dashboard/product-stats');
        setProducts(productRes.data.categories);
        setTotalStock(productRes.data.total);
        renderChart(productRes.data.categories);

        const ordersRes = await API.get('/dashboard/orders');
        setOrders(ordersRes.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };

    fetchData();
  }, [user]);

  const renderChart = (data) => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: data.map(d => `Category ${d.categoryID}`),
        datasets: [{
          label: 'Stock',
          data: data.map(d => d.stock),
          backgroundColor: '#04AA6D'
        }]
      },
    });
  };

  return (
    <div className="container mt-4">
      <h2>Welcome, {admin.fname} {admin.lname}</h2>

      <Row className="my-4">
        <Col md={8}>
          <canvas ref={chartRef}></canvas>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header>Product Stats</Card.Header>
            <Card.Body>
              {products.map(p => (
                <p key={p.categoryID}>
                  Category {p.categoryID}: {((p.stock / totalStock) * 100).toFixed(1)}%
                </p>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
          {orders.map(o => (
            <tr key={o.orderID}>
              <td>{o.fname} {o.lname}</td>
              <td>{o.orderID}</td>
              <td>{o.product}</td>
              <td>{o.quantity}</td>
              <td>${o.price}</td>
              <td>${o.price * o.quantity}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
