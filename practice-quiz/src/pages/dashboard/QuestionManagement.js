import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, message, Popconfirm, Row, Col, List, Checkbox } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import './QuestionManagement.css';

const { Option } = Select;

const QuestionManagement = () => {
    useAuth();
    const [questions, setQuestions] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [form] = Form.useForm();
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [filters, setFilters] = useState({
        content: '',
        questionType: 'all',
        level: 'all',
        status: 'all'
    });

    const fetchQuestions = async () => {
        try {
            setLoading(true);
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

    useEffect(() => {
        fetchQuestions();
        fetchQuizzes();
    }, []);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const filteredQuestions = questions.filter(question => {
        return (
            question.Content.toLowerCase().includes(filters.content.toLowerCase()) &&
            (filters.questionType === 'all' || question.QuestionType === filters.questionType) &&
            (filters.level === 'all' || question.Level === filters.level) &&
            (filters.status === 'all' || question.Status === filters.status)
        );
    });

    const handleEdit = (question) => {
        setEditingQuestion(question);
        form.setFieldsValue({
            ...question,
            quizId: question.QuizId.toString()
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (questionId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }
            const response = await fetch(`https://localhost:7107/api/Question?questionId=${questionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: questions.find(q => q.QuestionId === questionId).Content,
                    questionType: questions.find(q => q.QuestionId === questionId).QuestionType,
                    level: questions.find(q => q.QuestionId === questionId).Level,
                    quizId: questions.find(q => q.QuestionId === questionId).QuizId,
                    status: 'inactive'
                })
            });

            if (response.status === 401) {
                toast.error('Session expired. Please login again');
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }

            if (response.ok) {
                toast.success('Question deactivated successfully');
                fetchQuestions();
            } else {
                toast.error('Failed to deactivate question');
            }
        } catch (error) {
            console.error('Error deactivating question:', error);
            toast.error('Failed to deactivate question');
        }
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }

            if (editingQuestion) {
                // Update existing question
                const response = await fetch(`https://localhost:7107/api/Question?questionId=${editingQuestion.QuestionId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        content: values.Content,
                        questionType: values.QuestionType,
                        level: values.Level,
                        quizId: parseInt(values.quizId),
                        status: values.Status
                    })
                });

                if (response.status === 401) {
                    toast.error('Session expired. Please login again');
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    return;
                }

                if (response.ok) {
                    toast.success('Question updated successfully');
                    setIsModalVisible(false);
                    form.resetFields();
                    setEditingQuestion(null);
                    fetchQuestions();
                } else {
                    const errorData = await response.json();
                    toast.error(errorData.message || 'Failed to update question');
                }
            } else {
                // Create new question
                const response = await fetch('https://localhost:7107/api/Question', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        questionId: 0,
                        content: values.Content,
                        questionType: values.QuestionType,
                        level: values.Level,
                        quizId: parseInt(values.quizId),
                        status: values.Status
                    })
                });

                if (response.status === 401) {
                    toast.error('Session expired. Please login again');
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    return;
                }

                if (response.ok) {
                    toast.success('Question created successfully');
                    setIsModalVisible(false);
                    form.resetFields();
                    setEditingQuestion(null);
                    fetchQuestions();
                } else {
                    const errorData = await response.json();
                    toast.error(errorData.message || 'Failed to create question');
                }
            }
        } catch (error) {
            console.error('Error saving question:', error);
            toast.error('Failed to save question');
        }
    };

    const handleViewDetails = (question) => {
        setSelectedQuestion(question);
        setIsDetailsModalVisible(true);
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'QuestionId',
            key: 'QuestionId',
        },
        {
            title: 'Content',
            dataIndex: 'Content',
            key: 'Content',
        },
        {
            title: 'Type',
            dataIndex: 'QuestionType',
            key: 'QuestionType',
            render: (text) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: 'Level',
            dataIndex: 'Level',
            key: 'Level',
            render: (text) => <Tag color="green">{text}</Tag>,
        },
        {
            title: 'Created By',
            dataIndex: ['CreatedByUser', 'FullName'],
            key: 'CreatedBy',
        },
        {
            title: 'Created At',
            dataIndex: 'CreatedAt',
            key: 'CreatedAt',
            render: (text) => new Date(text).toLocaleDateString(),
        },
        {
            title: 'Status',
            dataIndex: 'Status',
            key: 'Status',
            render: (text) => (
                <Tag color={text === 'active' ? 'green' : 'red'}>
                    {text}
                </Tag>
            ),
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
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Are you sure you want to deactivate this question?"
                        onConfirm={() => handleDelete(record.QuestionId)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button danger icon={<DeleteOutlined />}>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <MainLayout>
            <div className="question-management">
                <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                    <Col>
                        <h2>Question Management</h2>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingQuestion(null);
                                form.resetFields();
                                setIsModalVisible(true);
                            }}
                        >
                            Add Question
                        </Button>
                    </Col>
                </Row>

                <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={6}>
                        <Input
                            placeholder="Search by content"
                            prefix={<SearchOutlined />}
                            value={filters.content}
                            onChange={(e) => handleFilterChange('content', e.target.value)}
                        />
                    </Col>
                    <Col span={6}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Question Type"
                            value={filters.questionType}
                            onChange={(value) => handleFilterChange('questionType', value)}
                        >
                            <Option value="all">All Types</Option>
                            <Option value="Multiple Choice">Multiple Choice</Option>
                            <Option value="True/False">True/False</Option>
                            <Option value="Short Answer">Short Answer</Option>
                        </Select>
                    </Col>
                    <Col span={6}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Level"
                            value={filters.level}
                            onChange={(value) => handleFilterChange('level', value)}
                        >
                            <Option value="all">All Levels</Option>
                            <Option value="Easy">Easy</Option>
                            <Option value="Medium">Medium</Option>
                            <Option value="Hard">Hard</Option>
                        </Select>
                    </Col>
                    <Col span={6}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Status"
                            value={filters.status}
                            onChange={(value) => handleFilterChange('status', value)}
                        >
                            <Option value="all">All Status</Option>
                            <Option value="active">Active</Option>
                            <Option value="inactive">Inactive</Option>
                        </Select>
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={filteredQuestions}
                    rowKey="QuestionId"
                    loading={loading}
                />

                {/* Question Details Modal */}
                <Modal
                    title="Question Details"
                    open={isDetailsModalVisible}
                    onCancel={() => setIsDetailsModalVisible(false)}
                    width={800}
                    footer={null}
                >
                    {selectedQuestion && (
                        <div className="question-details">
                            <div className="question-info">
                                <h3>Question Information</h3>
                                <p><strong>Content:</strong> {selectedQuestion.Content}</p>
                                <p><strong>Type:</strong> {selectedQuestion.QuestionType}</p>
                                <p><strong>Level:</strong> {selectedQuestion.Level}</p>
                                <p><strong>Created By:</strong> {selectedQuestion.CreatedByUser?.FullName}</p>
                                <p><strong>Created At:</strong> {new Date(selectedQuestion.CreatedAt).toLocaleString()}</p>
                                <p><strong>Status:</strong> <Tag color={selectedQuestion.Status === 'active' ? 'green' : 'red'}>{selectedQuestion.Status}</Tag></p>
                            </div>
                            
                            <div className="options-list">
                                <h3>Options</h3>
                                <List
                                    dataSource={selectedQuestion.Options}
                                    renderItem={(option) => (
                                        <List.Item>
                                            <List.Item.Meta
                                                avatar={<Checkbox checked={option.IsCorrect} disabled />}
                                                title={option.Content}
                                                description={`Status: ${option.Status}`}
                                            />
                                        </List.Item>
                                    )}
                                />
                            </div>
                        </div>
                    )}
                </Modal>

                <Modal
                    title={editingQuestion ? 'Edit Question' : 'Add Question'}
                    open={isModalVisible}
                    onOk={handleModalOk}
                    onCancel={() => {
                        setIsModalVisible(false);
                        form.resetFields();
                    }}
                >
                    <Form
                        form={form}
                        layout="vertical"
                    >
                        <Form.Item
                            name="Content"
                            label="Content"
                            rules={[{ required: true, message: 'Please input question content!' }]}
                        >
                            <Input.TextArea rows={4} />
                        </Form.Item>
                        <Form.Item
                            name="QuestionType"
                            label="Question Type"
                            rules={[{ required: true, message: 'Please select question type!' }]}
                        >
                            <Select>
                                <Option value="Multiple Choice">Multiple Choice</Option>
                                <Option value="True/False">True/False</Option>
                                <Option value="Short Answer">Short Answer</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="Level"
                            label="Level"
                            rules={[{ required: true, message: 'Please select level!' }]}
                        >
                            <Select>
                                <Option value="Easy">Easy</Option>
                                <Option value="Medium">Medium</Option>
                                <Option value="Hard">Hard</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="quizId"
                            label="Quiz"
                            rules={[{ required: true, message: 'Please select quiz!' }]}
                        >
                            <Select>
                                {quizzes.map(quiz => (
                                    <Option key={quiz.QuizId} value={quiz.QuizId.toString()}>
                                        {quiz.Title}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="Status"
                            label="Status"
                            rules={[{ required: true, message: 'Please select status!' }]}
                        >
                            <Select>
                                <Option value="active">Active</Option>
                                <Option value="inactive">Inactive</Option>
                            </Select>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </MainLayout>
    );
};

export default QuestionManagement; 