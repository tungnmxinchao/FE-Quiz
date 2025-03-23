import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Row, Col, Select, Input, Tooltip } from 'antd';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import './ResultManagement.css';

const { Option } = Select;

const ResultManagement = () => {
    useAuth();
    const [results, setResults] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
    const [selectedResult, setSelectedResult] = useState(null);
    const [filters, setFilters] = useState({
        studentName: '',
        quizTitle: 'all',
        score: 'all',
        dateRange: 'all'
    });

    const fetchResults = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }
            const response = await fetch('https://localhost:7107/api/Result', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.status === 401) {
                toast.error('Session expired. Please login again');
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error('Error fetching results:', error);
            toast.error('Failed to fetch results');
        } finally {
            setLoading(false);
        }
    };

    const fetchQuizzes = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }
            const response = await fetch('https://localhost:7107/odata/Quiz', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.status === 401) {
                toast.error('Session expired. Please login again');
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }
            const data = await response.json();
            setQuizzes(data.value);
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            toast.error('Failed to fetch quizzes');
        }
    };

    const fetchQuestions = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }
            const response = await fetch('https://localhost:7107/odata/Question', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.status === 401) {
                toast.error('Session expired. Please login again');
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }
            const data = await response.json();
            setQuestions(data.value);
        } catch (error) {
            console.error('Error fetching questions:', error);
            toast.error('Failed to fetch questions');
        }
    };

    useEffect(() => {
        fetchResults();
        fetchQuizzes();
        fetchQuestions();
    }, []);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Sort results by end time in descending order (newest first)
    const sortedResults = [...results].sort((a, b) => 
        new Date(b.endTime) - new Date(a.endTime)
    );

    const filteredResults = sortedResults.filter(result => {
        return (
            result.student.fullName.toLowerCase().includes(filters.studentName.toLowerCase()) &&
            (filters.quizTitle === 'all' || result.quiz.title === filters.quizTitle) &&
            (filters.score === 'all' || 
                (filters.score === 'high' && result.score >= 80) ||
                (filters.score === 'medium' && result.score >= 50 && result.score < 80) ||
                (filters.score === 'low' && result.score < 50))
        );
    });

    const handleViewDetails = (result) => {
        setSelectedResult(result);
        setIsDetailsModalVisible(true);
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'resultId',
            key: 'resultId',
        },
        {
            title: 'Student',
            dataIndex: ['student', 'fullName'],
            key: 'studentName',
        },
        {
            title: 'Quiz',
            dataIndex: ['quiz', 'title'],
            key: 'quizTitle',
        },
        {
            title: 'Score',
            dataIndex: 'score',
            key: 'score',
            render: (score) => (
                <Tag color={
                    score >= 80 ? 'green' :
                    score >= 50 ? 'orange' : 'red'
                }>
                    {score}
                </Tag>
            ),
        },
        {
            title: 'Start Time',
            dataIndex: 'startTime',
            key: 'startTime',
            render: (text) => new Date(text).toLocaleString(),
        },
        {
            title: 'End Time',
            dataIndex: 'endTime',
            key: 'endTime',
            render: (text) => new Date(text).toLocaleString(),
            sorter: (a, b) => new Date(b.endTime) - new Date(a.endTime),
            defaultSortOrder: 'descend',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetails(record)}
                    >
                        View Details
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <MainLayout>
            <div className="result-management">
                <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                    <Col>
                        <h2>Result Management</h2>
                    </Col>
                </Row>

                <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={6}>
                        <Input
                            placeholder="Search by student name"
                            prefix={<SearchOutlined />}
                            value={filters.studentName}
                            onChange={(e) => handleFilterChange('studentName', e.target.value)}
                        />
                    </Col>
                    <Col span={6}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Quiz"
                            value={filters.quizTitle}
                            onChange={(value) => handleFilterChange('quizTitle', value)}
                        >
                            <Option value="all">All Quizzes</Option>
                            {quizzes.map(quiz => (
                                <Option key={quiz.QuizId} value={quiz.Title}>
                                    {quiz.Title}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col span={6}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Score Range"
                            value={filters.score}
                            onChange={(value) => handleFilterChange('score', value)}
                        >
                            <Option value="all">All Scores</Option>
                            <Option value="high">High (≥80%)</Option>
                            <Option value="medium">Medium (50-79%)</Option>
                            <Option value="low">Low (&lt;50%)</Option>
                        </Select>
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={filteredResults}
                    rowKey="resultId"
                    loading={loading}
                />

                <Modal
                    title="Result Details"
                    open={isDetailsModalVisible}
                    onCancel={() => {
                        setIsDetailsModalVisible(false);
                        setSelectedResult(null);
                    }}
                    width={800}
                    footer={null}
                >
                    {selectedResult && (
                        <div className="result-details">
                            <div className="student-info">
                                <h3>Student Information</h3>
                                <p><strong>Name:</strong> {selectedResult.student.fullName}</p>
                                <p><strong>Email:</strong> {selectedResult.student.email}</p>
                            </div>
                            
                            <div className="quiz-info">
                                <h3>Quiz Information</h3>
                                <p><strong>Title:</strong> {selectedResult.quiz.title}</p>
                                <p><strong>Code:</strong> {selectedResult.quizCode}</p>
                                <p><strong>Time Limit:</strong> {selectedResult.quiz.timeLimit} minutes</p>
                            </div>

                            <div className="result-info">
                                <h3>Result Information</h3>
                                <p><strong>Score:</strong> <Tag color={
                                    selectedResult.score >= 80 ? 'green' :
                                    selectedResult.score >= 50 ? 'orange' : 'red'
                                }>{selectedResult.score}</Tag></p>
                                <p><strong>Start Time:</strong> {new Date(selectedResult.startTime).toLocaleString()}</p>
                                <p><strong>End Time:</strong> {new Date(selectedResult.endTime).toLocaleString()}</p>
                                <p><strong>Duration:</strong> {Math.round((new Date(selectedResult.endTime) - new Date(selectedResult.startTime)) / 1000 / 60)} minutes</p>
                            </div>

                            <div className="answers-info">
                                <h3>Answers</h3>
                                <Table
                                    dataSource={selectedResult.answers.map(answer => {
                                        // Find the question that contains this answer
                                        const question = questions.find(q => 
                                            q.Options.some(opt => opt.Content === answer.answerContent)
                                        );
                                        return {
                                            ...answer,
                                            questionContent: question ? question.Content : 'Question not found'
                                        };
                                    })}
                                    columns={[
                                        {
                                            title: 'Question',
                                            dataIndex: 'questionContent',
                                            key: 'questionContent',
                                            width: '50%',
                                        },
                                        {
                                            title: 'Answer',
                                            dataIndex: 'answerContent',
                                            key: 'answerContent',
                                            width: '30%',
                                        },
                                        {
                                            title: 'Status',
                                            dataIndex: 'isCorrect',
                                            key: 'isCorrect',
                                            width: '20%',
                                            render: (isCorrect) => (
                                                <Tag color={isCorrect ? 'green' : 'red'}>
                                                    {isCorrect ? 'Correct' : 'Incorrect'}
                                                </Tag>
                                            ),
                                        },
                                    ]}
                                    pagination={false}
                                    rowKey={(record, index) => index}
                                />
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </MainLayout>
    );
};

export default ResultManagement; 