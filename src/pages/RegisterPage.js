import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Divider } from 'antd';
import { MailOutlined, LockOutlined, PhoneOutlined, UserOutlined, FileSearchOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();

  const onFinish = async (values) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await registerApi(values);
      const payload  = data.data;
      login({
        userId:      payload.userId,
        email:       payload.email,
        firstName:   payload.firstName,
        lastName:    payload.lastName,
        fullName:    payload.fullName,
        phoneNumber: payload.phoneNumber,
      }, payload.accessToken);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <Card className="auth-card" style={{ width: 460 }}>
        <div className="auth-logo">
          <FileSearchOutlined style={{ fontSize: 42, color: '#1677ff' }} />
          <Title level={4} style={{ margin: '8px 0 0', color: '#1677ff' }}>Invoice Processing AI</Title>
          <Text type="secondary">Create your account</Text>
        </div>

        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

        <Form layout="vertical" onFinish={onFinish} size="large" autoComplete="off">
          <Form.Item name="firstName" label="First Name"
            rules={[{ required: true, message: 'First name is required' }, { max: 50 }]}
          >
            <Input prefix={<UserOutlined />} placeholder="John" />
          </Form.Item>

          <Form.Item name="lastName" label="Last Name"
            rules={[{ required: true, message: 'Last name is required' }, { max: 50 }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Doe" />
          </Form.Item>

          <Form.Item name="email" label="Email"
            rules={[{ required: true, type: 'email', message: 'Valid email required' }, { max: 100 }]}
          >
            <Input prefix={<MailOutlined />} placeholder="john@example.com" />
          </Form.Item>

          <Form.Item name="phoneNumber" label="Phone Number"
            rules={[{ required: true, message: 'Phone number is required' },
                    { pattern: /^\+?[0-9\-\s]{7,20}$/, message: 'Invalid phone number' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="+1 555 000 0000" />
          </Form.Item>

          <Form.Item name="password" label="Password"
            rules={[{ required: true, min: 8, message: 'Minimum 8 characters' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Min 8 characters" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <Divider plain><Text type="secondary" style={{ fontSize: 12 }}>Already registered?</Text></Divider>
        <div style={{ textAlign: 'center' }}>
          <Link to="/login">Sign in</Link>
        </div>
      </Card>
    </div>
  );
}
