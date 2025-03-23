import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, message, Popconfirm, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import './SubjectManagement.css';

const { Option } = Select;

const SubjectManagement = () => {
    useAuth();
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingSubject, setEditingSubject] = useState(null);
    const [filters, setFilters] = useState({
        subjectName: '',
        description: '',
        status: 'all'
    });

    const fetchSubjects = async () => {
        try {
            setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const filteredSubjects = subjects.filter(subject => {
        return (
            subject.SubjectName.toLowerCase().includes(filters.subjectName.toLowerCase()) &&
            subject.Description.toLowerCase().includes(filters.description.toLowerCase()) &&
            (filters.status === 'all' || subject.Status === filters.status)
        );
    });

    const handleEdit = (subject) => {
        setEditingSubject(subject);
        form.setFieldsValue(subject);
        setIsModalVisible(true);
    };

    const handleDelete = async (subjectId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }
            const response = await fetch(`https://localhost:7107/api/Subject?subjectId=${subjectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    subjectName: subjects.find(subject => subject.SubjectId === subjectId).SubjectName,
                    description: subjects.find(subject => subject.SubjectId === subjectId).Description,
                    status: 'Inactive'
                })
            });

            if (response.status === 401) {
                toast.error('Session expired. Please login again');
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }

            if (response.ok) {
                toast.success('Subject deactivated successfully');
                fetchSubjects();
            } else {
                toast.error('Failed to deactivate subject');
            }
        } catch (error) {
            console.error('Error deactivating subject:', error);
            toast.error('Failed to deactivate subject');
        }
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }

            if (editingSubject) {
                // Update existing subject
                const response = await fetch(`https://localhost:7107/api/Subject?subjectId=${editingSubject.SubjectId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        subjectName: values.SubjectName,
                        description: values.Description,
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
                    toast.success('Subject updated successfully');
                    setIsModalVisible(false);
                    form.resetFields();
                    setEditingSubject(null);
                    fetchSubjects();
                } else {
                    const errorData = await response.json();
                    toast.error(errorData.message || 'Failed to update subject');
                }
            } else {
                // Create new subject
                const response = await fetch('https://localhost:7107/api/Subject', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        subjectName: values.SubjectName,
                        description: values.Description,
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
                    toast.success('Subject created successfully');
                    setIsModalVisible(false);
                    form.resetFields();
                    setEditingSubject(null);
                    fetchSubjects();
                } else {
                    const errorData = await response.json();
                    toast.error(errorData.message || 'Failed to create subject');
                }
            }
        } catch (error) {
            console.error('Error saving subject:', error);
            toast.error('Failed to save subject');
        }
    };

    const columns = [
        {
            title: 'Subject Name',
            dataIndex: 'SubjectName',
            key: 'SubjectName',
        },
        {
            title: 'Description',
            dataIndex: 'Description',
            key: 'Description',
        },
        {
            title: 'Created By',
            key: 'CreatedByUser',
            render: (_, record) => record.CreatedByUser?.FullName || 'N/A',
        },
        {
            title: 'Status',
            dataIndex: 'Status',
            key: 'Status',
            render: (status) => (
                <Tag color={status === 'Active' ? 'success' : 'error'}>
                    {status}
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
                    <Popconfirm
                        title="Are you sure you want to deactivate this subject?"
                        onConfirm={() => handleDelete(record.SubjectId)}
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
            <div className="subject-management-container">
                <div className="header-actions">
                    <h1>Subject Management</h1>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditingSubject(null);
                            form.resetFields();
                            setIsModalVisible(true);
                        }}
                    >
                        Add New Subject
                    </Button>
                </div>

                <div className="filters-section">
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={8}>
                            <Input
                                placeholder="Search by subject name"
                                prefix={<SearchOutlined />}
                                value={filters.subjectName}
                                onChange={(e) => handleFilterChange('subjectName', e.target.value)}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Input
                                placeholder="Search by description"
                                prefix={<SearchOutlined />}
                                value={filters.description}
                                onChange={(e) => handleFilterChange('description', e.target.value)}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Select
                                placeholder="Filter by status"
                                style={{ width: '100%' }}
                                value={filters.status}
                                onChange={(value) => handleFilterChange('status', value)}
                            >
                                <Option value="all">All Status</Option>
                                <Option value="Active">Active</Option>
                                <Option value="Inactive">Inactive</Option>
                            </Select>
                        </Col>
                    </Row>
                </div>

                <Table 
                    columns={columns} 
                    dataSource={filteredSubjects}
                    loading={loading}
                    rowKey="SubjectId"
                    pagination={{ pageSize: 10 }}
                />

                <Modal
                    title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
                    open={isModalVisible}
                    onOk={handleModalOk}
                    onCancel={() => {
                        setIsModalVisible(false);
                        form.resetFields();
                        setEditingSubject(null);
                    }}
                >
                    <Form
                        form={form}
                        layout="vertical"
                    >
                        <Form.Item
                            name="SubjectName"
                            label="Subject Name"
                            rules={[{ required: true, message: 'Please input subject name!' }]}
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
                            name="Status"
                            label="Status"
                            rules={[{ required: true, message: 'Please select status!' }]}
                        >
                            <Select>
                                <Option value="Active">Active</Option>
                                <Option value="Inactive">Inactive</Option>
                            </Select>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </MainLayout>
    );
};

export default SubjectManagement; 