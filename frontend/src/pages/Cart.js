import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Container, ListGroup, Button } from 'react-bootstrap';

export default function Cart() {
  const [cart, setCart] = useState([]);

  const fetchCart = async () => {
    const res = await API.get('/cart');
    setCart(res.data);
  };

  useEffect(() => { fetchCart(); }, []);

  return (
    <Container>
      <h2>Your Cart</h2>
      <ListGroup>
        {cart.map(item => (
          <ListGroup.Item key={item.id}>
            {item.name} - {item.option_value || ''} x {item.quantity} = ${item.price * item.quantity}
          </ListGroup.Item>
        ))}
      </ListGroup>
      <Button className="mt-2" disabled={cart.length === 0}>Proceed to Checkout</Button>
    </Container>
  );
}
