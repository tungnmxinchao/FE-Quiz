import React from 'react';
import { Layout, Button, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './MainLayout.css';

const { Header, Content, Footer } = Layout;

const MainLayout = ({ children }) => {
    const navigate = useNavigate();

    return (
        <Layout className="layout">
            <Header className="header">
                <div className="logo">Practice Quiz</div>
                <Space>
                    <Button type="primary" icon={<UserOutlined />} onClick={() => navigate('/login')}>
                        Login
                    </Button>
                    <Button onClick={() => navigate('/register')}>Register</Button>
                </Space>
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