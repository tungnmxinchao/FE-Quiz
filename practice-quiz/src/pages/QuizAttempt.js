import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Radio, Button, Progress, Typography, Space, Modal } from 'antd';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getODataURL } from '../config/api.config';
import './QuizAttempt.css';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

const QuizAttempt = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const quizData = location.state?.quiz;
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    toast.error('Please login to take the quiz');
                    navigate('/login');
                    return;
                }

                if (!quizData) {
                    toast.error('Quiz information not found');
                    navigate('/home');
                    return;
                }

                setTimeLeft(quizData.TimeLimit * 60); // Convert minutes to seconds

                const questionsResponse = await fetch(
                    `${getODataURL('/Question')}?$filter=QuizId eq ${quizId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (questionsResponse.status === 401) {
                    toast.error('Session expired. Please login again');
                    navigate('/login');
                    return;
                }

                if (!questionsResponse.ok) {
                    throw new Error('Failed to fetch questions');
                }

                const data = await questionsResponse.json();
                if (data && Array.isArray(data.value)) {
                    const quizQuestions = data.value.filter(q => q.QuizId === parseInt(quizId));
                    setQuestions(quizQuestions);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error:', error);
                toast.error('Failed to load questions');
                navigate('/home');
            }
        };

        fetchQuestions();
    }, [quizId, navigate, quizData]);

    // Timer effect
    useEffect(() => {
        if (timeLeft <= 0 || loading) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, loading]);

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleSubmit = () => {
        Modal.confirm({
            title: 'Submit Quiz',
            content: 'Are you sure you want to submit your answers?',
            onOk: () => {
                // TODO: Implement submit logic
                toast.success('Quiz submitted successfully');
                navigate('/home');
            }
        });
    };

    if (loading) {
        return <div className="quiz-loading">Loading quiz...</div>;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (!currentQuestion) {
        return (
            <div className="quiz-loading">
                <Title level={3}>No questions available for this quiz</Title>
                <Button type="primary" onClick={() => navigate('/home')}>
                    Back to Home
                </Button>
            </div>
        );
    }

    return (
        <Layout className="quiz-attempt-layout">
            <Sider width={200} className="question-navigation">
                <div className="timer-section">
                    <Title level={5}>Time Remaining</Title>
                    <Text className="timer">{formatTime(timeLeft)}</Text>
                    <Progress 
                        percent={(timeLeft / (quizData.TimeLimit * 60)) * 100} 
                        showInfo={false}
                        status={timeLeft < 60 ? "exception" : "active"}
                    />
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[currentQuestionIndex.toString()]}
                    className="question-menu"
                >
                    {questions.map((question, index) => (
                        <Menu.Item
                            key={index}
                            onClick={() => setCurrentQuestionIndex(index)}
                            className={answers[question.QuestionId] ? 'answered' : ''}
                        >
                            Question {index + 1}
                        </Menu.Item>
                    ))}
                </Menu>
            </Sider>
            <Content className="quiz-content">
                <Card className="question-card">
                    <div className="question-header">
                        <Title level={4}>Question {currentQuestionIndex + 1}</Title>
                        <Text>{currentQuestion.Content}</Text>
                    </div>
                    <Radio.Group
                        className="options-group"
                        value={answers[currentQuestion.QuestionId]}
                        onChange={(e) => handleAnswerChange(currentQuestion.QuestionId, e.target.value)}
                    >
                        <Space direction="vertical" className="options-space">
                            {currentQuestion.Options.map(option => (
                                <Radio key={option.OptionId} value={option.OptionId}>
                                    {option.Content}
                                </Radio>
                            ))}
                        </Space>
                    </Radio.Group>
                    <div className="navigation-buttons">
                        <Button
                            disabled={currentQuestionIndex === 0}
                            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            disabled={currentQuestionIndex === questions.length - 1}
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        >
                            Next
                        </Button>
                        <Button type="primary" onClick={handleSubmit}>
                            Submit Quiz
                        </Button>
                    </div>
                </Card>
            </Content>
        </Layout>
    );
};

export default QuizAttempt; 