import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Spin, Button, message, Form, Input, Modal, Avatar } from 'antd';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { UserOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import MainLayout from '../components/Layout/MainLayout';
import './Profile.css';

const { Title, Text } = Typography;

const Profile = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');

            if (!token || !userId) {
                toast.error('Please login to view your profile');
                navigate('/login');
                return;
            }

            const response = await fetch(`https://localhost:7107/api/User/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                toast.error('Session expired. Please login again');
                navigate('/login');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }

            const data = await response.json();
            setUser(data);
            form.setFieldsValue({
                fullName: data.fullName,
                email: data.email
            });
        } catch (error) {
            console.error('Error fetching user profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (values) => {
        try {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');

            const requestBody = {
                fullName: values.fullName,
                email: values.email,
                role: "student",
                status: "active"
            };

            const response = await fetch(`https://localhost:7107/api/User/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const updatedUser = await response.json();
            setUser(updatedUser);
            setIsEditing(false);
            toast.success('Profile updated successfully');
            localStorage.setItem('userFullName', updatedUser.fullName);
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="profile-loading">
                    <Spin size="large" />
                </div>
            </MainLayout>
        );
    }

    if (!user) {
        return (
            <MainLayout>
                <div className="profile-error">
                    <Title level={3}>Profile not found</Title>
                    <Button type="primary" onClick={() => navigate('/home')}>
                        Back to Home
                    </Button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="profile-container">
                <Card className="profile-card">
                    <div className="profile-header">
                        <Avatar size={100} icon={<UserOutlined />} className="profile-avatar" />
                        <div className="profile-title">
                            <Title level={2}>{user.fullName}</Title>
                            <Text type="secondary">@{user.username}</Text>
                        </div>
                        <Button 
                            type="primary" 
                            icon={isEditing ? <CloseOutlined /> : <EditOutlined />}
                            onClick={() => setIsEditing(!isEditing)}
                            className="edit-button"
                        >
                            {isEditing ? 'Cancel' : 'Edit Profile'}
                        </Button>
                    </div>

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleUpdateProfile}
                        disabled={!isEditing}
                        className="profile-form"
                    >
                        <Form.Item
                            name="fullName"
                            label="Full Name"
                            rules={[{ required: true, message: 'Please input your full name!' }]}
                        >
                            <Input prefix={<UserOutlined />} />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                                { required: true, message: 'Please input your email!' },
                                { type: 'email', message: 'Please enter a valid email!' }
                            ]}
                        >
                            <Input />
                        </Form.Item>

                        <div className="profile-info">
                            <div className="info-item">
                                <Text strong>Username:</Text>
                                <Text>{user.username}</Text>
                            </div>
                            <div className="info-item">
                                <Text strong>Role:</Text>
                                <Text>{user.role}</Text>
                            </div>
                            <div className="info-item">
                                <Text strong>Status:</Text>
                                <Text>{user.status}</Text>
                            </div>
                            <div className="info-item">
                                <Text strong>Created At:</Text>
                                <Text>{new Date(user.createdAt).toLocaleString()}</Text>
                            </div>
                            <div className="info-item">
                                <Text strong>Last Updated:</Text>
                                <Text>{new Date(user.updatedAt).toLocaleString()}</Text>
                            </div>
                        </div>

                        {isEditing && (
                            <div className="form-actions">
                                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                                    Save Changes
                                </Button>
                            </div>
                        )}
                    </Form>

                    <div className="profile-actions">
                        <Button type="primary" onClick={() => navigate('/home')}>
                            Back to Home
                        </Button>
                    </div>
                </Card>
            </div>
        </MainLayout>
    );
};

export default Profile; 