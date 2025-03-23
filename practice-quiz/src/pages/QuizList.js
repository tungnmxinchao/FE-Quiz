import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Space, Button, Pagination, Empty, Input, Modal, Form } from 'antd';
import { ClockCircleOutlined, UserOutlined, BookOutlined, SearchOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getODataURL } from '../config/api.config';
import MainLayout from '../components/Layout/MainLayout';
import './QuizList.css';

const { Title, Text } = Typography;
const { Search } = Input;

const QuizList = () => {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [error, setError] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [form] = Form.useForm();

    const handleStartQuiz = (quiz) => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            toast.warning('Please login to start the quiz');
            navigate('/login', { state: { from: `/quiz/${quiz.QuizId}` } });
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            toast.warning('Please login to start the quiz');
            return;
        }

        setSelectedQuiz(quiz);
        setShowCodeModal(true);
    };

    const handleJoinQuiz = async (values) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.warning('Please login to join the quiz');
                return;
            }

            const response = await fetch('https://localhost:7107/api/Quiz/join-practice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    quizId: selectedQuiz.QuizId,
                    quizCode: values.quizCode
                })
            });

            if (response.status === 401) {
                toast.error('Wrong quiz code!');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to join quiz');
            }

            // Save quiz code to localStorage
            localStorage.setItem(`quizCode_${selectedQuiz.QuizId}`, values.quizCode);

            toast.success('Successfully joined the quiz!');
            setShowCodeModal(false);
            form.resetFields();
            navigate(`/quiz/${selectedQuiz.QuizId}`, { state: { quiz: selectedQuiz } });
        } catch (error) {
            console.error('Error joining quiz:', error);
            toast.error('Failed to join the quiz. Please try again.');
        }
    };

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            setError(null);
            const skip = (currentPage - 1) * pageSize;
            let url = `${getODataURL('/Quiz')}?$count=true&$skip=${skip}&$top=${pageSize}`;
            url += `&$filter=SubjectId eq ${subjectId}`;
            
            // Add search filter if search text exists
            if (searchText) {
                url += ` and contains(Title, '${searchText}')`;
            }

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
    }, [currentPage, pageSize, subjectId, searchText]);

    const handleSearch = (value) => {
        setSearchText(value);
        setCurrentPage(1);
    };

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
                    <Search
                        placeholder="Search by Quiz Title"
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: 300 }}
                        prefix={<SearchOutlined />}
                    />
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

                <Modal
                    title="Enter Quiz Code"
                    open={showCodeModal}
                    onCancel={() => {
                        setShowCodeModal(false);
                        form.resetFields();
                    }}
                    footer={null}
                >
                    <Form
                        form={form}
                        onFinish={handleJoinQuiz}
                        layout="vertical"
                    >
                        <Form.Item
                            name="quizCode"
                            label="Quiz Code"
                            rules={[{ required: true, message: 'Please enter the quiz code' }]}
                        >
                            <Input placeholder="Enter the quiz code" />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block>
                                Join Quiz
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </MainLayout>
    );
};

export default QuizList; 