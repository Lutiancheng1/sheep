import React from 'react';
import { Layout, Menu, theme, Button, Modal } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogoutOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { logout } from '../services/api';
import Breadcrumb from '../components/Breadcrumb';

const { Content, Sider } = Layout;

const MainLayout: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = React.useState(false);

  const items = [
    {
      key: '/levels',
      label: '关卡管理',
    },
    {
      key: '/users',
      label: '用户管理',
    },
    {
      key: '/logs',
      label: '日志审计',
    },
    {
      key: '/config',
      label: '系统配置',
    },
  ];

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      icon: <ExclamationCircleOutlined />,
      content: '确定要退出登录吗?',
      okText: '确认退出',
      cancelText: '取消',
      onOk: () => {
        logout();
        navigate('/login');
      },
    });
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <div
          style={{
            height: 64,
            margin: 16,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {!collapsed && (
            <span
              style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px', whiteSpace: 'nowrap' }}
            >
              羊了个羊
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1 }}
        />
        {/* 退出登录按钮 - 固定在最底部 */}
        <div style={{ padding: '16px' }}>
          <Button
            ghost
            block
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ height: 40, color: '#fff', borderColor: 'rgba(255, 255, 255, 0.3)' }}
          >
            {!collapsed && '退出登录'}
          </Button>
        </div>
      </Sider>
      <Layout style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Content
          style={{
            margin: '24px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flex: 1,
          }}
        >
          <Breadcrumb />
          <div
            style={{
              padding: 24,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              marginTop: 16,
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
