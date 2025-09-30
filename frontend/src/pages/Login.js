import React, { useState } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    const res = await API.post('/auth/login', { email, password });
    setUser(res.data.user);
    navigate('/');
  };

  return (
    <Container>
      <h2>Login</h2>
      <Form onSubmit={submit}>
        <Form.Group>
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </Form.Group>
        <Form.Group>
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </Form.Group>
        <Button type="submit" className="mt-2">Login</Button>
      </Form>
    </Container>
  );
}
