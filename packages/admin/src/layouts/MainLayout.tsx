import React from 'react';
import {Layout, Menu, theme, Button, Modal} from 'antd';
import {Outlet, useNavigate, useLocation} from 'react-router-dom';
import {LogoutOutlined, ExclamationCircleOutlined} from '@ant-design/icons';
import {logout} from '../services/api';

const {Header, Content, Sider} = Layout;

const MainLayout: React.FC = () => {
  const {
    token: {colorBgContainer, borderRadiusLG},
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
    <Layout style={{minHeight: '100vh'}}>
      <Sider 
        breakpoint="lg" 
        collapsedWidth="0"
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
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
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px', whiteSpace: 'nowrap' }}>
              羊了个羊 
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={({key}) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{fontSize: '18px', fontWeight: 'bold'}}>管理后台</div>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            退出登录
          </Button>
        </Header>
        <Content style={{margin: '24px 16px 0'}}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
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
