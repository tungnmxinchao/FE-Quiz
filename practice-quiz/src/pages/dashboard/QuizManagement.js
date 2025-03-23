import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, message, Popconfirm, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, KeyOutlined } from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import './QuizManagement.css';

const { Option } = Select;

const QuizManagement = () => {
    useAuth();
    const [quizzes, setQuizzes] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingQuiz, setEditingQuiz] = useState(null);
    const [filters, setFilters] = useState({
        title: '',
        description: '',
        subjectId: 'all',
        status: 'all'
    });
    const [isCodeModalVisible, setIsCodeModalVisible] = useState(false);
    const [quizCode, setQuizCode] = useState(null);
    const [loadingCode, setLoadingCode] = useState(false);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }
            const response = await fetch('https://localhost:7107/odata/Subject', {
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
            setSubjects(data.value);
        } catch (error) {
            console.error('Error fetching subjects:', error);
            toast.error('Failed to fetch subjects');
        }
    };

    useEffect(() => {
        fetchQuizzes();
        fetchSubjects();
    }, []);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const filteredQuizzes = quizzes.filter(quiz => {
        return (
            quiz.Title.toLowerCase().includes(filters.title.toLowerCase()) &&
            quiz.Description.toLowerCase().includes(filters.description.toLowerCase()) &&
            (filters.subjectId === 'all' || quiz.SubjectId === parseInt(filters.subjectId)) &&
            (filters.status === 'all' || quiz.Status === filters.status)
        );
    });

    const handleEdit = (quiz) => {
        setEditingQuiz(quiz);
        form.setFieldsValue({
            ...quiz,
            subjectId: quiz.SubjectId.toString()
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (quizId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }
            const response = await fetch(`https://localhost:7107/api/Quiz?quizId=${quizId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: quizzes.find(quiz => quiz.QuizId === quizId).Title,
                    description: quizzes.find(quiz => quiz.QuizId === quizId).Description,
                    subjectId: quizzes.find(quiz => quiz.QuizId === quizId).SubjectId,
                    timeLimit: quizzes.find(quiz => quiz.QuizId === quizId).TimeLimit,
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
                toast.success('Quiz deactivated successfully');
                fetchQuizzes();
            } else {
                toast.error('Failed to deactivate quiz');
            }
        } catch (error) {
            console.error('Error deactivating quiz:', error);
            toast.error('Failed to deactivate quiz');
        }
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }

            if (editingQuiz) {
                // Update existing quiz
                const response = await fetch(`https://localhost:7107/api/Quiz?quizId=${editingQuiz.QuizId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: values.Title,
                        description: values.Description,
                        subjectId: parseInt(values.subjectId),
                        timeLimit: parseInt(values.TimeLimit),
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
                    toast.success('Quiz updated successfully');
                    setIsModalVisible(false);
                    form.resetFields();
                    setEditingQuiz(null);
                    fetchQuizzes();
                } else {
                    const errorData = await response.json();
                    toast.error(errorData.message || 'Failed to update quiz');
                }
            } else {
                // Create new quiz
                const response = await fetch('https://localhost:7107/api/Quiz', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        quizId: 0,
                        title: values.Title,
                        description: values.Description,
                        subjectId: parseInt(values.subjectId),
                        timeLimit: parseInt(values.TimeLimit),
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
                    toast.success('Quiz created successfully');
                    setIsModalVisible(false);
                    form.resetFields();
                    setEditingQuiz(null);
                    fetchQuizzes();
                } else {
                    const errorData = await response.json();
                    toast.error(errorData.message || 'Failed to create quiz');
                }
            }
        } catch (error) {
            console.error('Error saving quiz:', error);
            toast.error('Failed to save quiz');
        }
    };

    const handleViewCode = async (quizId) => {
        try {
            setLoadingCode(true);
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }
            const response = await fetch(`https://localhost:7107/api/Quiz/quiz-code/${quizId}`, {
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

            if (response.ok) {
                const data = await response.json();
                setQuizCode(data);
                setIsCodeModalVisible(true);
            } else {
                toast.error('Failed to fetch quiz code');
            }
        } catch (error) {
            console.error('Error fetching quiz code:', error);
            toast.error('Failed to fetch quiz code');
        } finally {
            setLoadingCode(false);
        }
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'Title',
            key: 'Title',
        },
        {
            title: 'Description',
            dataIndex: 'Description',
            key: 'Description',
        },
        {
            title: 'Subject',
            key: 'Subject',
            render: (_, record) => record.Subject?.SubjectName || 'N/A',
        },
        {
            title: 'Time Limit (minutes)',
            dataIndex: 'TimeLimit',
            key: 'TimeLimit',
        },
        {
            title: 'Created By',
            key: 'Teacher',
            render: (_, record) => record.Teacher?.FullName || 'N/A',
        },
        {
            title: 'Status',
            dataIndex: 'Status',
            key: 'Status',
            render: (status) => (
                <Tag color={status === 'active' ? 'success' : 'error'}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Created At',
            dataIndex: 'CreatedAt',
            key: 'CreatedAt',
            render: (date) => new Date(date).toLocaleString(),
        },
        {
            title: 'Updated At',
            dataIndex: 'UpdatedAt',
            key: 'UpdatedAt',
            render: (date) => new Date(date).toLocaleString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button 
                        type="primary" 
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                    <Button
                        icon={<KeyOutlined />}
                        onClick={() => handleViewCode(record.QuizId)}
                        loading={loadingCode}
                    >
                        View Code
                    </Button>
                    <Popconfirm
                        title="Are you sure you want to deactivate this quiz?"
                        onConfirm={() => handleDelete(record.QuizId)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button 
                            danger 
                            icon={<DeleteOutlined />}
                        >
                            Deactivate
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <MainLayout>
            <div className="quiz-management-container">
                <div className="header-actions">
                    <h1>Quiz Management</h1>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditingQuiz(null);
                            form.resetFields();
                            setIsModalVisible(true);
                        }}
                    >
                        Add New Quiz
                    </Button>
                </div>

                <div className="filters-section">
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                            <Input
                                placeholder="Search by title"
                                prefix={<SearchOutlined />}
                                value={filters.title}
                                onChange={(e) => handleFilterChange('title', e.target.value)}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Input
                                placeholder="Search by description"
                                prefix={<SearchOutlined />}
                                value={filters.description}
                                onChange={(e) => handleFilterChange('description', e.target.value)}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Select
                                placeholder="Filter by subject"
                                style={{ width: '100%' }}
                                value={filters.subjectId}
                                onChange={(value) => handleFilterChange('subjectId', value)}
                            >
                                <Option value="all">All Subjects</Option>
                                {subjects.map(subject => (
                                    <Option key={subject.SubjectId} value={subject.SubjectId}>
                                        {subject.SubjectName}
                                    </Option>
                                ))}
                            </Select>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Select
                                placeholder="Filter by status"
                                style={{ width: '100%' }}
                                value={filters.status}
                                onChange={(value) => handleFilterChange('status', value)}
                            >
                                <Option value="all">All Status</Option>
                                <Option value="active">Active</Option>
                                <Option value="inactive">Inactive</Option>
                            </Select>
                        </Col>
                    </Row>
                </div>

                <Table 
                    columns={columns} 
                    dataSource={filteredQuizzes}
                    loading={loading}
                    rowKey="QuizId"
                    pagination={{ pageSize: 10 }}
                />

                <Modal
                    title={editingQuiz ? 'Edit Quiz' : 'Add New Quiz'}
                    open={isModalVisible}
                    onOk={handleModalOk}
                    onCancel={() => {
                        setIsModalVisible(false);
                        form.resetFields();
                        setEditingQuiz(null);
                    }}
                >
                    <Form
                        form={form}
                        layout="vertical"
                    >
                        <Form.Item
                            name="Title"
                            label="Title"
                            rules={[{ required: true, message: 'Please input quiz title!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="Description"
                            label="Description"
                            rules={[{ required: true, message: 'Please input description!' }]}
                        >
                            <Input.TextArea rows={4} />
                        </Form.Item>

                        <Form.Item
                            name="subjectId"
                            label="Subject"
                            rules={[{ required: true, message: 'Please select subject!' }]}
                        >
                            <Select>
                                {subjects.map(subject => (
                                    <Option key={subject.SubjectId} value={subject.SubjectId}>
                                        {subject.SubjectName}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="TimeLimit"
                            label="Time Limit (minutes)"
                            rules={[{ required: true, message: 'Please input time limit!' }]}
                        >
                            <Input type="number" min={1} />
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

                <Modal
                    title="Quiz Code"
                    open={isCodeModalVisible}
                    onCancel={() => {
                        setIsCodeModalVisible(false);
                        setQuizCode(null);
                    }}
                    footer={null}
                >
                    {quizCode && (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <h3>Quiz Code</h3>
                            <div style={{ 
                                fontSize: '24px', 
                                fontWeight: 'bold', 
                                color: '#1890ff',
                                padding: '10px',
                                backgroundColor: '#f0f2f5',
                                borderRadius: '4px',
                                marginTop: '10px'
                            }}>
                                {quizCode.code}
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </MainLayout>
    );
};

export default QuizManagement; 