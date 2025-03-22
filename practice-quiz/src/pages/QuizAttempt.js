import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout, Menu, Card, Radio, Button, Progress, Typography, Space, Modal, Tooltip, message } from 'antd';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { StarOutlined, StarFilled, LeftOutlined, RightOutlined, CheckCircleOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
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
    const [starredQuestions, setStarredQuestions] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [startTime, setStartTime] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    // Memoize the initial time limit
    const timeLimit = useMemo(() => quizData?.TimeLimit * 60 || 0, [quizData]);

    // Memoize current question
    const currentQuestion = useMemo(() => questions[currentQuestionIndex], [questions, currentQuestionIndex]);

    // Memoize progress calculation
    const progress = useMemo(() => ({
        answered: Object.keys(answers).length,
        total: questions.length,
        percent: (Object.keys(answers).length / questions.length) * 100
    }), [answers, questions.length]);

    const formatTime = useCallback((seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }, []);

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

                // Check if there's a saved start time
                const savedStartTime = localStorage.getItem(`quiz_start_time_${quizId}`);
                if (savedStartTime) {
                    setStartTime(parseInt(savedStartTime));
                    const elapsed = Math.floor((Date.now() - parseInt(savedStartTime)) / 1000);
                    const remaining = Math.max(0, timeLimit - elapsed);
                    setTimeLeft(remaining);
                } else {
                    // If no saved time, start new timer
                    setStartTime(Date.now());
                    localStorage.setItem(`quiz_start_time_${quizId}`, Date.now().toString());
                    setTimeLeft(timeLimit);
                }

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
    }, [quizId, navigate, quizData, timeLimit]);

    // Optimized timer effect
    useEffect(() => {
        if (timeLeft <= 0 || loading || !startTime) return;

        const timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, timeLimit - elapsed);
            
            if (remaining <= 0) {
                clearInterval(timer);
                handleSubmit();
                return;
            }
            
            setTimeLeft(remaining);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, loading, startTime, timeLimit]);

    const handleAnswerChange = useCallback((questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    }, []);

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');

            if (!token) {
                message.error('Vui lòng đăng nhập để nộp bài');
                navigate('/login');
                return;
            }

            if (!userId) {
                message.error('Không tìm thấy thông tin người dùng');
                navigate('/login');
                return;
            }

            const submitData = {
                studentId: parseInt(userId),
                quizId: parseInt(quizId),
                answers: Object.entries(answers).map(([questionId, optionId]) => {
                    const question = questions.find(q => q.QuestionId === parseInt(questionId));
                    const selectedOption = question.Options.find(opt => opt.OptionId === optionId);
                    return {
                        questionId: parseInt(questionId),
                        answerContent: selectedOption.Content,
                        createdBy: parseInt(userId)
                    };
                })
            };

            const response = await fetch('https://localhost:7107/api/Result', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(submitData)
            });

            if (response.status === 401) {
                message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
                navigate('/login');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to submit quiz');
            }

            const result = await response.json();
            if (result) {
                // Clear the saved start time when submitting
                localStorage.removeItem(`quiz_start_time_${quizId}`);
                message.success('Nộp bài thành công!');
                navigate(`/quiz/${quizId}/result`, { 
                    state: { 
                        result: result,
                        quiz: quizData
                    }
                });
            }
        } catch (error) {
            console.error('Error submitting quiz:', error);
            message.error('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại!');
        } finally {
            setIsSubmitting(false);
            setShowSubmitModal(false);
        }
    };

    const handleSubmitClick = () => {
        const unansweredCount = questions.length - Object.keys(answers).length;
        if (unansweredCount > 0) {
            Modal.confirm({
                title: 'Xác nhận nộp bài',
                content: `Bạn còn ${unansweredCount} câu hỏi chưa trả lời. Bạn có chắc chắn muốn nộp bài?`,
                okText: 'Nộp bài',
                cancelText: 'Tiếp tục làm bài',
                onOk: () => setShowSubmitModal(true)
            });
        } else {
            setShowSubmitModal(true);
        }
    };

    const handleStarQuestion = useCallback((questionId) => {
        setStarredQuestions(prev => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
    }, []);

    if (loading) {
        return <div className="quiz-loading">Loading quiz...</div>;
    }

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
            <Sider width={280} className="question-navigation">
                <div className="quiz-info-section">
                    <Title level={4}>{quizData.Title}</Title>
                    <Text type="secondary">{quizData.Description}</Text>
                </div>
                <div className="timer-section">
                    <Title level={5}>Time Remaining</Title>
                    <Text className="timer">{formatTime(timeLeft)}</Text>
                    <Progress 
                        percent={(timeLeft / timeLimit) * 100} 
                        showInfo={false}
                        status={timeLeft < 60 ? "exception" : "active"}
                        strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                        }}
                    />
                </div>
                <div className="questions-progress">
                    <Text>Progress: {progress.answered} / {progress.total} answered</Text>
                    <Progress 
                        percent={progress.percent}
                        size="small"
                        showInfo={false}
                        strokeColor="#52c41a"
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
                            className={`question-item ${answers[question.QuestionId] ? 'answered' : ''} ${starredQuestions[question.QuestionId] ? 'starred' : ''}`}
                        >
                            <div className="question-item-content">
                                <span className="question-number">Question {index + 1}</span>
                                {answers[question.QuestionId] && (
                                    <CheckCircleOutlined className="answered-icon" />
                                )}
                                <Button
                                    type="text"
                                    size="small"
                                    className="star-button"
                                    icon={starredQuestions[question.QuestionId] ? <StarFilled /> : <StarOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStarQuestion(question.QuestionId);
                                    }}
                                />
                            </div>
                        </Menu.Item>
                    ))}
                </Menu>
            </Sider>
            <Content className="quiz-content">
                <Card className="question-card">
                    <div className="question-header">
                        <div className="question-title">
                            <Title level={4}>Câu hỏi {currentQuestionIndex + 1}</Title>
                            <Button
                                type="text"
                                icon={starredQuestions[currentQuestion.QuestionId] ? <StarFilled /> : <StarOutlined />}
                                onClick={() => handleStarQuestion(currentQuestion.QuestionId)}
                                className={`star-question-button ${starredQuestions[currentQuestion.QuestionId] ? 'starred' : ''}`}
                            >
                                {starredQuestions[currentQuestion.QuestionId] ? 'Đã đánh dấu' : 'Đánh dấu để xem lại'}
                            </Button>
                        </div>
                        <Text className="question-content">{currentQuestion.Content}</Text>
                        <div className="question-meta">
                            <Text type="secondary">Loại: {currentQuestion.QuestionType}</Text>
                            <Text type="secondary">Độ khó: {currentQuestion.Level}</Text>
                        </div>
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
                            icon={<ArrowLeftOutlined />}
                            disabled={currentQuestionIndex === 0}
                            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                        >
                            Câu trước
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleSubmitClick}
                            loading={isSubmitting}
                        >
                            Nộp bài
                        </Button>
                        <Button
                            icon={<ArrowRightOutlined />}
                            disabled={currentQuestionIndex === questions.length - 1}
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        >
                            Câu tiếp
                        </Button>
                    </div>
                </Card>
            </Content>

            <Modal
                title="Xác nhận nộp bài"
                open={showSubmitModal}
                onOk={handleSubmit}
                onCancel={() => setShowSubmitModal(false)}
                confirmLoading={isSubmitting}
            >
                <p>Bạn có chắc chắn muốn nộp bài?</p>
                <p>Thời gian còn lại: {formatTime(timeLeft)}</p>
            </Modal>
        </Layout>
    );
};

export default QuizAttempt; 