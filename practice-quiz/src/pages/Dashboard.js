import React from 'react';
import { Card, Row, Col, Statistic, Button } from 'antd';
import { 
    UserOutlined, 
    BookOutlined, 
    FileTextOutlined, 
    QuestionCircleOutlined, 
    BarChartOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();

    const managementCards = [
        {
            title: 'User Management',
            icon: <UserOutlined />,
            value: 'Users',
            color: '#1890ff',
            path: '/dashboard/users'
        },
        {
            title: 'Subject Management',
            icon: <BookOutlined />,
            value: 'Subjects',
            color: '#52c41a',
            path: '/dashboard/subjects'
        },
        {
            title: 'Quiz Management',
            icon: <FileTextOutlined />,
            value: 'Quizzes',
            color: '#722ed1',
            path: '/dashboard/quizzes'
        },
        {
            title: 'Question Management',
            icon: <QuestionCircleOutlined />,
            value: 'Questions',
            color: '#fa8c16',
            path: '/dashboard/questions'
        },
        {
            title: 'Result Management',
            icon: <BarChartOutlined />,
            value: 'Results',
            color: '#eb2f96',
            path: '/dashboard/results'
        }
    ];

    return (
        <MainLayout>
            <div className="dashboard-container">
                <h1>Teacher Dashboard</h1>
                <Row gutter={[16, 16]}>
                    {managementCards.map((card, index) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={index}>
                            <Card 
                                hoverable 
                                className="management-card"
                                onClick={() => navigate(card.path)}
                            >
                                <Statistic
                                    title={card.title}
                                    value={card.value}
                                    prefix={<div style={{ color: card.color }}>{card.icon}</div>}
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        </MainLayout>
    );
};

export default Dashboard; 