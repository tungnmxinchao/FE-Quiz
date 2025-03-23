import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, message, Popconfirm, Row, Col, List, Checkbox, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, EyeOutlined, CloseOutlined } from '@ant-design/icons';
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
    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [newQuestionOptions, setNewQuestionOptions] = useState([]);
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
            const question = questions.find(q => q.QuestionId === questionId);
            const response = await fetch(`https://localhost:7107/api/Question/${questionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    quizId: question.QuizId,
                    content: question.Content,
                    questionType: question.QuestionType,
                    level: question.Level,
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

    const handleAddNewOption = () => {
        if (newQuestionOptions.length >= 4) {
            toast.error('Maximum 4 options allowed');
            return;
        }
        const newOption = {
            content: '',
            isCorrect: false,
            status: 'active'
        };
        setNewQuestionOptions([...newQuestionOptions, newOption]);
    };

    const handleRemoveNewOption = (index) => {
        setNewQuestionOptions(newQuestionOptions.filter((_, i) => i !== index));
    };

    const handleNewOptionChange = (index, field, value) => {
        setNewQuestionOptions(newQuestionOptions.map((opt, i) => 
            i === index ? { ...opt, [field]: value } : opt
        ));
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
                const response = await fetch(`https://localhost:7107/api/Question/${editingQuestion.QuestionId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        quizId: parseInt(values.quizId),
                        content: values.Content,
                        questionType: values.QuestionType,
                        level: values.Level,
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
                    setNewQuestionOptions([]);
                    fetchQuestions();
                } else {
                    const errorData = await response.json();
                    toast.error(errorData.message || 'Failed to update question');
                }
            } else {
                // Validate options for new question
                if (newQuestionOptions.length === 0) {
                    toast.error('Please add at least one option');
                    return;
                }

                const hasCorrectOption = newQuestionOptions.some(option => option.isCorrect);
                if (!hasCorrectOption) {
                    toast.error('Please select at least one correct option');
                    return;
                }

                // Create new question
                const response = await fetch('https://localhost:7107/api/Question', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        quizId: parseInt(values.quizId),
                        content: values.Content,
                        questionType: values.QuestionType,
                        level: values.Level,
                        status: values.Status,
                        options: newQuestionOptions
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
                    setNewQuestionOptions([]);
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
        setIsEditing(false);
        setIsDetailsModalVisible(true);
    };

    const handleEditDetails = () => {
        setIsEditing(true);
        form.setFieldsValue({
            ...selectedQuestion,
            quizId: selectedQuestion.QuizId.toString()
        });
    };

    const handleSaveDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');
            if (!token || !userId) {
                return;
            }

            // Format options for API
            const formattedOptions = selectedQuestion.Options.map(option => ({
                optionId: option.isNew ? 0 : option.OptionId, // Set to 0 for new options
                questionId: selectedQuestion.QuestionId,
                createdBy: parseInt(userId),
                content: option.Content,
                isCorrect: option.IsCorrect,
                status: option.Status
            }));

            // Update options
            const optionsResponse = await fetch('https://localhost:7107/api/Option/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formattedOptions)
            });

            if (optionsResponse.status === 401) {
                toast.error('Session expired. Please login again');
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }

            if (optionsResponse.ok) {
                toast.success('Options updated successfully');
                setIsEditing(false);
                
                // Fetch updated question data
                const questionResponse = await fetch(`https://localhost:7107/odata/Question(${selectedQuestion.QuestionId})`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (questionResponse.ok) {
                    const updatedQuestion = await questionResponse.json();
                    setSelectedQuestion(updatedQuestion);
                }
                
                // Fetch all questions after a short delay to ensure data is updated
                setTimeout(() => {
                    fetchQuestions();
                }, 500);
            } else {
                const errorData = await optionsResponse.json();
                toast.error(errorData.message || 'Failed to update options');
            }
        } catch (error) {
            console.error('Error saving options:', error);
            toast.error('Failed to save options');
        }
    };

    const handleOptionChange = (optionId, field, value) => {
        setSelectedQuestion({
            ...selectedQuestion,
            Options: selectedQuestion.Options.map(opt => 
                opt.OptionId === optionId ? { ...opt, [field]: value } : opt
            )
        });
    };

    const handleAddOption = () => {
        if (selectedQuestion.Options.length >= 4) {
            toast.error('Maximum 4 options allowed');
            return;
        }
        const tempId = Date.now(); // Generate temporary unique ID for state management
        const newOption = {
            OptionId: tempId, // Use temporary ID for state management
            QuestionId: selectedQuestion.QuestionId,
            Content: '',
            IsCorrect: false,
            Status: 'active',
            isNew: true // Flag to identify new options
        };
        setSelectedQuestion({
            ...selectedQuestion,
            Options: [...selectedQuestion.Options, newOption]
        });
    };

    const handleRemoveOption = (optionId) => {
        setSelectedQuestion({
            ...selectedQuestion,
            Options: selectedQuestion.Options.filter(opt => opt.OptionId !== optionId)
        });
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
                    title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Question Details</span>
                            {!isEditing ? (
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={handleEditDetails}
                                >
                                    Edit Options
                                </Button>
                            ) : (
                                <Space>
                                    <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button type="primary" onClick={handleSaveDetails}>Save Options</Button>
                                </Space>
                            )}
                        </div>
                    }
                    open={isDetailsModalVisible}
                    onCancel={() => {
                        setIsDetailsModalVisible(false);
                        setIsEditing(false);
                    }}
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h3>Options</h3>
                                    {isEditing && (
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={handleAddOption}
                                            disabled={selectedQuestion.Options.length >= 4}
                                        >
                                            Add Option
                                        </Button>
                                    )}
                                </div>
                                <List
                                    dataSource={selectedQuestion.Options}
                                    renderItem={(option) => (
                                        <List.Item
                                            actions={isEditing ? [
                                                <Tooltip title="Remove Option">
                                                    <Button
                                                        type="text"
                                                        danger
                                                        icon={<CloseOutlined />}
                                                        onClick={() => handleRemoveOption(option.OptionId)}
                                                    />
                                                </Tooltip>
                                            ] : null}
                                        >
                                            <List.Item.Meta
                                                avatar={
                                                    isEditing ? (
                                                        <Checkbox
                                                            checked={option.IsCorrect}
                                                            onChange={(e) => handleOptionChange(option.OptionId, 'IsCorrect', e.target.checked)}
                                                        />
                                                    ) : (
                                                        <Checkbox checked={option.IsCorrect} disabled />
                                                    )
                                                }
                                                title={
                                                    isEditing ? (
                                                        <Input
                                                            value={option.Content}
                                                            onChange={(e) => handleOptionChange(option.OptionId, 'Content', e.target.value)}
                                                            placeholder="Enter option content"
                                                        />
                                                    ) : (
                                                        option.Content
                                                    )
                                                }
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
                        setNewQuestionOptions([]);
                    }}
                    width={800}
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

                        {!editingQuestion && (
                            <div className="options-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h3>Options</h3>
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={handleAddNewOption}
                                        disabled={newQuestionOptions.length >= 4}
                                    >
                                        Add Option
                                    </Button>
                                </div>
                                <List
                                    dataSource={newQuestionOptions}
                                    renderItem={(option, index) => (
                                        <List.Item
                                            actions={[
                                                <Tooltip title="Remove Option">
                                                    <Button
                                                        type="text"
                                                        danger
                                                        icon={<CloseOutlined />}
                                                        onClick={() => handleRemoveNewOption(index)}
                                                    />
                                                </Tooltip>
                                            ]}
                                        >
                                            <List.Item.Meta
                                                avatar={
                                                    <Checkbox
                                                        checked={option.isCorrect}
                                                        onChange={(e) => handleNewOptionChange(index, 'isCorrect', e.target.checked)}
                                                    />
                                                }
                                                title={
                                                    <Input
                                                        value={option.content}
                                                        onChange={(e) => handleNewOptionChange(index, 'content', e.target.value)}
                                                        placeholder="Enter option content"
                                                    />
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            </div>
                        )}
                    </Form>
                </Modal>
            </div>
        </MainLayout>
    );
};

export default QuestionManagement; 