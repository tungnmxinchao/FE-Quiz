import React from 'react';
import { Form, Input, Button, Card } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import MainLayout from '../components/Layout/MainLayout';
import './Login.css';

const Register = () => {
    const navigate = useNavigate();

    const onFinish = async (values) => {
        try {
            const response = await fetch('https://localhost:7107/api/User/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: values.username,
                    password: values.password,
                    fullName: values.fullName,
                    email: values.email
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('🎉 Registration successful! Please login.', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
                navigate('/login');
            } else {
                toast.error(data.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            toast.error('Registration failed. Please try again.');
        }
    };

    return (
        <MainLayout>
            <div className="login-container">
                <Card className="login-card">
                    <h1>Register</h1>
                    <Form
                        name="register"
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
                            rules={[
                                { required: true, message: 'Please input your password!' },
                                { min: 6, message: 'Password must be at least 6 characters!' }
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="Password"
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            name="fullName"
                            rules={[{ required: true, message: 'Please input your full name!' }]}
                        >
                            <Input 
                                prefix={<UserOutlined />} 
                                placeholder="Full Name"
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: 'Please input your email!' },
                                { type: 'email', message: 'Please enter a valid email!' }
                            ]}
                        >
                            <Input 
                                prefix={<MailOutlined />} 
                                placeholder="Email"
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" block size="large">
                                Register
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </MainLayout>
    );
};

export default Register; 