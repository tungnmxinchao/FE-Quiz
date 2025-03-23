import React, { useState, useEffect } from 'react';
import { Layout, Button, Space, Menu } from 'antd';
import { UserOutlined, LogoutOutlined, HomeOutlined, HistoryOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import './MainLayout.css';

const { Header, Content, Footer } = Layout;

const MainLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userFullName, setUserFullName] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const name = localStorage.getItem('userFullName');
        if (token) {
            setIsLoggedIn(true);
            setUserFullName(name || '');
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userFullName');
        setIsLoggedIn(false);
        setUserFullName('');
        toast.info('👋 Logged out successfully', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
        navigate('/home');
    };

    const menuItems = [
        {
            key: '/home',
            icon: <HomeOutlined />,
            label: 'Home'
        },
        ...(isLoggedIn ? [
            {
                key: '/history',
                icon: <HistoryOutlined />,
                label: 'Quiz History'
            },
            {
                key: '/profile',
                icon: <UserOutlined />,
                label: 'My Profile'
            }
        ] : [])
    ];

    return (
        <Layout className="layout">
            <Header className="header">
                <div className="logo">Practice Quiz</div>
                <div className="header-content">
                    <Menu
                        mode="horizontal"
                        selectedKeys={[location.pathname]}
                        items={menuItems}
                        onClick={({ key }) => navigate(key)}
                        className="header-menu"
                    />
                    <Space>
                        {isLoggedIn ? (
                            <>
                                <span className="user-name">Welcome, {userFullName}</span>
                                <Button 
                                    type="primary" 
                                    icon={<LogoutOutlined />} 
                                    onClick={handleLogout}
                                >
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button 
                                    type="primary" 
                                    icon={<UserOutlined />} 
                                    onClick={() => navigate('/login')}
                                >
                                    Login
                                </Button>
                                <Button onClick={() => navigate('/register')}>
                                    Register
                                </Button>
                            </>
                        )}
                    </Space>
                </div>
            </Header>
            <Content className="content">
                <div className="content-container">
                    {children}
                </div>
            </Content>
            <Footer className="footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3>About Us</h3>
                        <p>Practice Quiz is a platform for students to enhance their knowledge through interactive quizzes.</p>
                    </div>
                    <div className="footer-section">
                        <h3>Quick Links</h3>
                        <ul>
                            <li>Home</li>
                            <li>Subjects</li>
                            <li>Contact</li>
                            <li>Help</li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h3>Contact</h3>
                        <p>Email: support@practicequiz.com</p>
                        <p>Phone: (123) 456-7890</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    © 2024 Practice Quiz. All rights reserved.
                </div>
            </Footer>
        </Layout>
    );
};

export default MainLayout; 