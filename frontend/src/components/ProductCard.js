import React, { useState } from 'react';
import { Card, Button, Form } from 'react-bootstrap';
import API from '../services/api';

export default function ProductCard({ product }) {
  const [selectedOption, setSelectedOption] = useState(product.options?.[0]?.id || null);

  const addToCart = async () => {
    await API.post('/cart/add', {
      product_id: product.id,
      selected_option_id: selectedOption,
      quantity: 1
    });
    alert('Added to cart');
  };

  return (
    <Card style={{ width: '18rem', margin: '10px' }}>
      <Card.Img variant="top" src={product.options?.find(o => o.id === selectedOption)?.image_url || product.image} />
      <Card.Body>
        <Card.Title>{product.name}</Card.Title>
        <Card.Text>${product.price}</Card.Text>
        {product.options && (
          <Form.Select value={selectedOption} onChange={e => setSelectedOption(e.target.value)}>
            {product.options.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.option_value}</option>
            ))}
          </Form.Select>
        )}
        <Button className="mt-2" onClick={addToCart}>Add to Cart</Button>
      </Card.Body>
    </Card>
  );
}
