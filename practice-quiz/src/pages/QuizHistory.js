import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, Space, Button, Pagination, Empty, message, Modal, Tag, List } from 'antd';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getODataURL } from '../config/api.config';
import MainLayout from '../components/Layout/MainLayout';
import './QuizHistory.css';

const { Title, Text } = Typography;

const QuizHistory = () => {
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedResult, setSelectedResult] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);

    const columns = [
        {
            title: 'Quiz Title',
            dataIndex: ['Quiz', 'Title'],
            key: 'quizTitle',
        },
        {
            title: 'Score',
            dataIndex: 'Score',
            key: 'score',
            render: (score) => `${score}%`,
        },
        {
            title: 'Start Time',
            dataIndex: 'StartTime',
            key: 'startTime',
            render: (date) => new Date(date).toLocaleString(),
        },
        {
            title: 'End Time',
            dataIndex: 'EndTime',
            key: 'endTime',
            render: (date) => new Date(date).toLocaleString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button type="primary" onClick={() => handleViewDetails(record)}>
                        View Details
                    </Button>
                </Space>
            ),
        },
    ];

    const handleViewDetails = async (result) => {
        setSelectedResult(result);
        setShowDetailsModal(true);
        await fetchQuestions(result.QuizId);
    };

    const fetchQuestions = async (quizId) => {
        try {
            setLoadingQuestions(true);
            const token = localStorage.getItem('token');
            const url = `${getODataURL('/Question')}?$filter=QuizId eq ${quizId}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch questions');
            }

            const data = await response.json();
            if (data && Array.isArray(data.value)) {
                setQuestions(data.value);
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
            toast.error('Failed to load questions');
        } finally {
            setLoadingQuestions(false);
        }
    };

    const fetchResults = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');

            if (!token || !userId) {
                toast.error('Please login to view your history');
                navigate('/login');
                return;
            }

            const skip = (currentPage - 1) * pageSize;
            const url = `${getODataURL('/Result')}?$count=true&$skip=${skip}&$top=${pageSize}&$filter=StudentId eq ${userId}&$orderby=CreatedAt desc`;

            const response = await fetch(url, {
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
                throw new Error('Failed to fetch results');
            }

            const data = await response.json();
            if (data && Array.isArray(data.value)) {
                setResults(data.value);
                setTotal(data['@odata.count'] || 0);
            } else {
                setResults([]);
                setTotal(0);
            }
        } catch (error) {
            console.error('Error fetching results:', error);
            toast.error('Failed to load quiz history');
            setResults([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResults();
    }, [currentPage, pageSize]);

    const renderQuestionDetails = () => {
        if (!selectedResult || !questions.length) return null;

        return (
            <List
                dataSource={questions}
                renderItem={(question, index) => {
                    const answer = selectedResult.Answers[index];
                    const correctOption = question.Options.find(opt => opt.IsCorrect);
                    const isCorrect = answer && answer.IsCorrect;

                    return (
                        <List.Item className="question-detail-item">
                            <div className="question-detail-content">
                                <div className="question-header">
                                    <Text strong>Question {index + 1}</Text>
                                    <Tag color={isCorrect ? "success" : "error"}>
                                        {isCorrect ? "Correct" : "Incorrect"}
                                    </Tag>
                                </div>
                                <Text className="question-content">{question.Content}</Text>
                                <div className="answer-section">
                                    <div className="your-answer">
                                        <Text type="secondary">Your Answer: </Text>
                                        <Text>{answer?.AnswerContent}</Text>
                                    </div>
                                    {!isCorrect && correctOption && (
                                        <div className="correct-answer">
                                            <Text type="secondary">Correct Answer: </Text>
                                            <Text>{correctOption.Content}</Text>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </List.Item>
                    );
                }}
            />
        );
    };

    return (
        <MainLayout>
            <div className="quiz-history-container">
                <Title level={2}>Quiz History</Title>
                
                {loading ? (
                    <Card loading={true} />
                ) : results.length === 0 ? (
                    <Empty
                        description="No quiz history found"
                        className="empty-state"
                    >
                        <Button type="primary" onClick={() => navigate('/home')}>
                            Back to Home
                        </Button>
                    </Empty>
                ) : (
                    <>
                        <Table
                            columns={columns}
                            dataSource={results}
                            rowKey="ResultId"
                            pagination={false}
                            loading={loading}
                        />
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
                                showTotal={(total) => `Total ${total} results`}
                            />
                        </div>
                    </>
                )}

                <Modal
                    title={`Quiz Details - ${selectedResult?.Quiz?.Title}`}
                    open={showDetailsModal}
                    onCancel={() => setShowDetailsModal(false)}
                    width={800}
                    footer={null}
                >
                    <div className="quiz-details-header">
                        <Space direction="vertical" size="small">
                            <Text>Score: {selectedResult?.Score}%</Text>
                            <Text>Start Time: {selectedResult?.StartTime && new Date(selectedResult.StartTime).toLocaleString()}</Text>
                            <Text>End Time: {selectedResult?.EndTime && new Date(selectedResult.EndTime).toLocaleString()}</Text>
                        </Space>
                    </div>
                    {loadingQuestions ? (
                        <div className="loading-questions">Loading questions...</div>
                    ) : (
                        renderQuestionDetails()
                    )}
                </Modal>
            </div>
        </MainLayout>
    );
};

export default QuizHistory; 