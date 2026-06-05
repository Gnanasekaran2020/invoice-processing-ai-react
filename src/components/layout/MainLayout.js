import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Space, Button, Tag } from 'antd';
import {
  DashboardOutlined, FileTextOutlined, UploadOutlined,
  LogoutOutlined, UserOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  FileSearchOutlined, BarChartOutlined, CrownOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/',        icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/invoices',icon: <FileTextOutlined />,  label: 'Invoices' },
    { key: '/upload',  icon: <UploadOutlined />,    label: 'Upload Invoice' },
    { key: '/reports', icon: <BarChartOutlined />,  label: 'Reports' },
    { key: '/profile', icon: <UserOutlined />,      label: 'My Profile' },
  ];

  const selectedKey = menuItems
    .map(i => i.key)
    .filter(k => location.pathname === k || (k !== '/' && location.pathname.startsWith(k)))
    .pop() || '/';

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />,  label: 'My Profile' },
      { type: 'divider' },
      { key: 'logout',  icon: <LogoutOutlined />, label: 'Logout', danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'logout')  { logout(); navigate('/login'); }
      if (key === 'profile') navigate('/profile');
    },
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{ background: '#001529' }}
        width={220}
      >
        <div style={{ padding: collapsed ? '20px 16px' : '20px 24px', borderBottom: '1px solid #112240' }}>
          <Space>
            <FileSearchOutlined style={{ fontSize: 22, color: '#1677ff' }} />
            {!collapsed && (
              <Text strong style={{ color: '#fff', fontSize: 14 }}>InvoiceAI</Text>
            )}
          </Space>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ marginTop: 8 }}
        />
      </Sider>

      <Layout>
        <Header style={{
          background: '#fff', padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 18 }}
          />

          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ background: isAdmin ? '#722ed1' : '#1677ff' }} />
              <Text strong style={{ fontSize: 13 }}>{user?.fullName || user?.email}</Text>
              {isAdmin && (
                <Tag icon={<CrownOutlined />} color="purple" style={{ margin: 0 }}>Admin</Tag>
              )}
            </Space>
          </Dropdown>
        </Header>

        <Content style={{ margin: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
