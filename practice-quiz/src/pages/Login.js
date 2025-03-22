import React from 'react';
import { Form, Input, Button, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import MainLayout from '../components/Layout/MainLayout';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();

    const onFinish = async (values) => {
        try {
            const response = await fetch('https://localhost:7107/api/User/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (response.ok) {
                // Save token and user data to localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.user.userId);
                localStorage.setItem('userFullName', data.user.fullName);
                
                toast.success('🎉 Login successful!', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
                
                navigate('/home');
            } else {
                toast.error('❌ ' + (data.message || 'Please check your credentials'), {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('❌ Login failed. Please try again later.', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    };

    return (
        <MainLayout>
            <div className="login-container">
                <Card className="login-card">
                    <h1>Login</h1>
                    <Form
                        name="login"
                        onFinish={onFinish}
                        autoComplete="off"
                        layout="vertical"
                    >
                        <Form.Item
                            name="username"
                            rules={[{ required: true, message: 'Please input your username!' }]}
                        >
                            <Input 
                                prefix={<UserOutlined />} 
                                placeholder="Username"
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: 'Please input your password!' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="Password"
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" block size="large">
                                Log in
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </MainLayout>
    );
};

export default Login; 