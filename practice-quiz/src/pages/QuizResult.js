import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Progress, Space, Divider, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import './QuizResult.css';

const { Title, Text } = Typography;

const QuizResult = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const result = location.state?.result;
    const quiz = location.state?.quiz;

    if (!result || !quiz) {
        return (
            <div className="quiz-result-error">
                <Title level={3}>Không tìm thấy kết quả bài thi</Title>
                <Button type="primary" onClick={() => navigate('/home')}>
                    Về trang chủ
                </Button>
            </div>
        );
    }

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateScorePercentage = () => {
        return (result.score / result.answers.length) * 100;
    };

    return (
        <div className="quiz-result-container">
            <Card className="result-card">
                <div className="result-header">
                    <Title level={2}>{quiz.title}</Title>
                    <Text className="quiz-code">Mã bài thi: {result.quizCode}</Text>
                </div>

                <div className="score-section">
                    <Progress
                        type="circle"
                        percent={100}
                        format={() => `${result.score}`}
                        strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                        }}
                    />
                    <Title level={3}>Điểm số của bạn</Title>
                </div>

                <Divider />

                <div className="time-info">
                    <Space direction="vertical" size="small">
                        <div className="time-item">
                            <ClockCircleOutlined />
                            <Text>Thời gian bắt đầu: {formatTime(result.startTime)}</Text>
                        </div>
                        <div className="time-item">
                            <ClockCircleOutlined />
                            <Text>Thời gian kết thúc: {formatTime(result.endTime)}</Text>
                        </div>
                        <div className="time-item">
                            <ClockCircleOutlined />
                            <Text>Thời gian làm bài: {Math.floor((new Date(result.endTime) - new Date(result.startTime)) / 60000)} phút</Text>
                        </div>
                    </Space>
                </div>

                <Divider />

                <div className="answers-section">
                    <Title level={4}>Chi tiết câu trả lời</Title>
                    {result.answers.map((answer, index) => (
                        <Card key={index} className="answer-card">
                            <div className="answer-header">
                                <Text strong>Câu {index + 1}</Text>
                                <Tag color={answer.isCorrect ? "success" : "error"}>
                                    {answer.isCorrect ? "Đúng" : "Sai"}
                                </Tag>
                            </div>
                            <div className="answer-content">
                                <Text>{answer.answerContent}</Text>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="action-buttons">
                    <Button type="primary" onClick={() => navigate('/home')}>
                        Về trang chủ
                    </Button>
                    <Button onClick={() => navigate(`/quiz/${result.quizId}`)}>
                        Xem lại bài thi
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default QuizResult; 