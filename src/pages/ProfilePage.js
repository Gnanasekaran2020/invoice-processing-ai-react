import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Typography, Space, message, Tag, Spin, Alert } from 'antd';
import { UserOutlined, SaveOutlined, CrownOutlined } from '@ant-design/icons';
import { getProfile, updateProfile } from '../api/profileApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { user, login, isAdmin } = useAuth();
  const [form] = Form.useForm();
  const [loading, setSaving]    = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    getProfile()
      .then(({ data }) => {
        const p = data.data;
        form.setFieldsValue({
          email:       p.email,
          firstName:   p.firstName,
          lastName:    p.lastName,
          phoneNumber: p.phoneNumber,
        });
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setFetching(false));
  }, [form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const { data } = await updateProfile(values);
      const updated  = data.data;
      // Update stored user in AuthContext with new name/email
      login({ ...user, ...updated, fullName: updated.fullName }, localStorage.getItem('token'));
      message.success('Profile updated successfully');
    } catch (e) {
      if (e.errorFields) return;
      message.error(e.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  if (fetching) return <div style={{ textAlign: 'center', paddingTop: 80 }}><Spin size="large" /></div>;
  if (error)    return <Alert type="error" message={error} showIcon />;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <Space>
          <UserOutlined style={{ fontSize: 20 }} />
          <Title level={3} style={{ margin: 0 }}>My Profile</Title>
          {isAdmin && <Tag icon={<CrownOutlined />} color="purple">Administrator</Tag>}
        </Space>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Form form={form} layout="vertical" onFinish={handleSave}>

          <Form.Item label="Email" name="email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Invalid email format' },
            ]}>
            <Input />
          </Form.Item>

          <Form.Item label="First Name" name="firstName"
            rules={[{ required: true, message: 'First name is required' }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Last Name" name="lastName"
            rules={[{ required: true, message: 'Last name is required' }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Phone Number" name="phoneNumber"
            rules={[
              { required: true, message: 'Phone number is required' },
              { pattern: /^\+?[0-9\-\s]{7,20}$/, message: 'Invalid phone number' },
            ]}>
            <Input />
          </Form.Item>

          <Form.Item label="Role">
            <Text>
              {isAdmin
                ? <Tag icon={<CrownOutlined />} color="purple">ADMIN</Tag>
                : <Tag color="blue">USER</Tag>}
            </Text>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={loading} block>
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
