import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Space, Button, Pagination, Empty } from 'antd';
import { ClockCircleOutlined, UserOutlined, BookOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getODataURL } from '../config/api.config';
import MainLayout from '../components/Layout/MainLayout';
import './QuizList.css';

const { Title, Text } = Typography;

const QuizList = () => {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [error, setError] = useState(null);

    const handleStartQuiz = (quiz) => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            toast.warning('Please login to start the quiz');
            navigate('/login', { state: { from: `/quiz/${quiz.QuizId}` } });
            return;
        }
        navigate(`/quiz/${quiz.QuizId}`, { state: { quiz } });
    };

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            setError(null);
            const skip = (currentPage - 1) * pageSize;
            let url = `${getODataURL('/Quiz')}?$count=true&$skip=${skip}&$top=${pageSize}`;
            url += `&$filter=SubjectId eq ${subjectId}`;
            url += '&$orderby=CreatedAt desc';

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch quizzes');
            }

            const data = await response.json();
            
            if (data && Array.isArray(data.value)) {
                setQuizzes(data.value);
                setTotal(data['@odata.count'] || 0);
            } else {
                setQuizzes([]);
                setTotal(0);
            }
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            toast.error('Failed to load quizzes');
            setError(error.message);
            setQuizzes([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (subjectId) {
            fetchQuizzes();
        }
    }, [currentPage, pageSize, subjectId]);

    if (error) {
        return (
            <MainLayout>
                <div className="quiz-list-container">
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <span className="error-message">
                                Something went wrong. Please try again later.
                            </span>
                        }
                    >
                        <Button type="primary" onClick={() => navigate('/home')}>
                            Back to Home
                        </Button>
                    </Empty>
                </div>
            </MainLayout>
        );
    }

    const currentSubject = quizzes[0]?.Subject;

    return (
        <MainLayout>
            <div className="quiz-list-container">
                <div className="quiz-list-header">
                    <Title level={2}>
                        {currentSubject ? currentSubject.SubjectName : 'Subject'} Quizzes
                    </Title>
                    {currentSubject && (
                        <Text className="subtitle">{currentSubject.Description}</Text>
                    )}
                </div>

                {loading ? (
                    <div className="loading-container">
                        {[1, 2, 3, 4].map((n) => (
                            <Card key={n} loading={true} className="quiz-card" />
                        ))}
                    </div>
                ) : quizzes.length === 0 ? (
                    <Empty
                        description="No quizzes available for this subject"
                        className="empty-state"
                    >
                        <Button type="primary" onClick={() => navigate('/home')}>
                            Back to Home
                        </Button>
                    </Empty>
                ) : (
                    <Row gutter={[24, 24]}>
                        {quizzes.map((quiz) => (
                            <Col xs={24} sm={12} md={8} lg={6} key={quiz.QuizId}>
                                <Card
                                    hoverable
                                    className="quiz-card"
                                    actions={[
                                        <Button 
                                            type="primary" 
                                            className="start-quiz-button"
                                            onClick={() => handleStartQuiz(quiz)}
                                        >
                                            Start Quiz
                                        </Button>
                                    ]}
                                >
                                    <div className="quiz-icon">
                                        <BookOutlined />
                                    </div>
                                    <Title level={4} className="quiz-title">
                                        {quiz.Title}
                                    </Title>
                                    <Text className="quiz-description">
                                        {quiz.Description}
                                    </Text>
                                    <div className="quiz-meta">
                                        <Space>
                                            <UserOutlined />
                                            <Text>{quiz.Teacher?.FullName}</Text>
                                        </Space>
                                        <Space>
                                            <ClockCircleOutlined />
                                            <Text>{quiz.TimeLimit} minutes</Text>
                                        </Space>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}

                {!loading && quizzes.length > 0 && (
                    <div className="pagination-section">
                        <Pagination
                            current={currentPage}
                            pageSize={pageSize}
                            total={total}
                            onChange={(page, size) => {
                                setCurrentPage(page);
                                setPageSize(size);
                            }}
                            showSizeChanger
                            showTotal={(total) => `Total ${total} quizzes`}
                        />
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default QuizList; 