import React, {useState, useEffect} from 'react';
import {Form, Input, Button, Card, message, Checkbox} from 'antd';
import {UserOutlined, LockOutlined} from '@ant-design/icons';
import {useNavigate} from 'react-router-dom';
import {adminLogin} from '../services/api';

const REMEMBER_KEY = 'remember_login';
const USERNAME_KEY = 'login_username';
const PASSWORD_KEY = 'login_password';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_KEY) === 'true';
    if (remembered) {
      const savedUsername = localStorage.getItem(USERNAME_KEY);
      const savedPassword = localStorage.getItem(PASSWORD_KEY);

      if (savedUsername && savedPassword) {
        form.setFieldsValue({
          username: savedUsername,
          password: savedPassword,
        });
        setRememberMe(true);
      }
    }
  }, [form]);

  const onFinish = async (values: {username: string; password: string}) => {
    setLoading(true);
    try {
      await adminLogin(values.username, values.password);

      // 保存或清除凭据
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, 'true');
        localStorage.setItem(USERNAME_KEY, values.username);
        localStorage.setItem(PASSWORD_KEY, values.password);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(USERNAME_KEY);
        localStorage.removeItem(PASSWORD_KEY);
      }

      message.success('登录成功!');
      navigate('/');
    } catch (error) {
      message.error('登录失败,请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundImage: 'url(/assets/login-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)', // 遮罩层，确保文字可读
          backdropFilter: 'blur(4px)', // 背景模糊
        }}
      />
      <Card
        title={
          <div style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
            羊了个羊 - 后台管理系统
          </div>
        }
        style={{
          width: 400,
          background: 'rgba(255, 255, 255, 0.85)', // 半透明白色背景
          backdropFilter: 'blur(10px)', // 毛玻璃效果
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          position: 'relative', // 确保在遮罩层之上
          zIndex: 1,
        }}
      >
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{required: true, message: '请输入用户名'}]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{required: true, message: '请输入密码'}]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            >
              记住密码
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>

          <div style={{textAlign: 'center', color: '#888', fontSize: '12px'}}>
            默认账户: admin / admin123
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
