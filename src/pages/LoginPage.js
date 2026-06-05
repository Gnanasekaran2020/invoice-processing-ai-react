import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Divider } from 'antd';
import { MailOutlined, LockOutlined, FileSearchOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../api/authApi';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();

  const onFinish = async (values) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await loginApi(values);
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
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <Card className="auth-card">
        <div className="auth-logo">
          <FileSearchOutlined style={{ fontSize: 42, color: '#1677ff' }} />
          <Title level={4} style={{ margin: '8px 0 0', color: '#1677ff' }}>Invoice Processing AI</Title>
          <Text type="secondary">Sign in to your account</Text>
        </div>

        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

        <Form layout="vertical" onFinish={onFinish} size="large" autoComplete="off">
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
            <Input prefix={<MailOutlined />} placeholder="Email address" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Please enter your password' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <Divider plain><Text type="secondary" style={{ fontSize: 12 }}>New here?</Text></Divider>
        <div style={{ textAlign: 'center' }}>
          <Link to="/register">Create an account</Link>
        </div>
      </Card>
    </div>
  );
}
