import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, message, Popconfirm, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import './UserManagement.css';

const { Option } = Select;

const UserManagement = () => {
    useAuth(); // Add authentication check
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingUser, setEditingUser] = useState(null);
    const [filters, setFilters] = useState({
        username: '',
        fullName: '',
        role: 'all',
        status: 'all'
    });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }
            const response = await fetch('https://localhost:7107/odata/User', {
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
            setUsers(data.value);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const filteredUsers = users.filter(user => {
        return (
            user.Username.toLowerCase().includes(filters.username.toLowerCase()) &&
            user.FullName.toLowerCase().includes(filters.fullName.toLowerCase()) &&
            (filters.role === 'all' || user.Role === filters.role) &&
            (filters.status === 'all' || user.Status === filters.status)
        );
    });

    const handleEdit = (user) => {
        setEditingUser(user);
        form.setFieldsValue(user);
        setIsModalVisible(true);
    };

    const handleDelete = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }
            const response = await fetch(`https://localhost:7107/api/User/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...users.find(user => user.UserId === userId),
                    Status: 'inactive'
                })
            });

            if (response.status === 401) {
                toast.error('Session expired. Please login again');
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }

            if (response.ok) {
                toast.success('User deactivated successfully');
                fetchUsers();
            } else {
                toast.error('Failed to deactivate user');
            }
        } catch (error) {
            console.error('Error deactivating user:', error);
            toast.error('Failed to deactivate user');
        }
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }

            if (editingUser) {
                // Update existing user
                const response = await fetch(`https://localhost:7107/api/User/${editingUser.UserId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(values)
                });

                if (response.status === 401) {
                    toast.error('Session expired. Please login again');
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    return;
                }

                if (response.ok) {
                    toast.success('User updated successfully');
                    setIsModalVisible(false);
                    form.resetFields();
                    setEditingUser(null);
                    fetchUsers();
                } else {
                    toast.error('Failed to update user');
                }
            } else {
                // Register new user
                const response = await fetch('https://localhost:7107/api/User/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        username: values.Username,
                        password: values.Password,
                        fullName: values.FullName,
                        email: values.Email
                    })
                });

                if (response.status === 401) {
                    toast.error('Session expired. Please login again');
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    return;
                }

                if (response.ok) {
                    toast.success('User created successfully');
                    setIsModalVisible(false);
                    form.resetFields();
                    setEditingUser(null);
                    fetchUsers();
                } else {
                    const errorData = await response.json();
                    toast.error(errorData.message || 'Failed to create user');
                }
            }
        } catch (error) {
            console.error('Error saving user:', error);
            toast.error('Failed to save user');
        }
    };

    const columns = [
        {
            title: 'Username',
            dataIndex: 'Username',
            key: 'Username',
        },
        {
            title: 'Full Name',
            dataIndex: 'FullName',
            key: 'FullName',
        },
        {
            title: 'Email',
            dataIndex: 'Email',
            key: 'Email',
        },
        {
            title: 'Role',
            dataIndex: 'Role',
            key: 'Role',
            render: (role) => (
                <Tag color={role === 'teacher' ? 'blue' : 'green'}>
                    {role.toUpperCase()}
                </Tag>
            ),
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
                        title="Are you sure you want to deactivate this user?"
                        onConfirm={() => handleDelete(record.UserId)}
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
            <div className="user-management-container">
                <div className="header-actions">
                    <h1>User Management</h1>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditingUser(null);
                            form.resetFields();
                            setIsModalVisible(true);
                        }}
                    >
                        Add New User
                    </Button>
                </div>

                <div className="filters-section">
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                            <Input
                                placeholder="Search by username"
                                prefix={<SearchOutlined />}
                                value={filters.username}
                                onChange={(e) => handleFilterChange('username', e.target.value)}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Input
                                placeholder="Search by full name"
                                prefix={<SearchOutlined />}
                                value={filters.fullName}
                                onChange={(e) => handleFilterChange('fullName', e.target.value)}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Select
                                placeholder="Filter by role"
                                style={{ width: '100%' }}
                                value={filters.role}
                                onChange={(value) => handleFilterChange('role', value)}
                            >
                                <Option value="all">All Roles</Option>
                                <Option value="teacher">Teacher</Option>
                                <Option value="student">Student</Option>
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
                    dataSource={filteredUsers}
                    loading={loading}
                    rowKey="UserId"
                    pagination={{ pageSize: 10 }}
                />

                <Modal
                    title={editingUser ? 'Edit User' : 'Add New User'}
                    open={isModalVisible}
                    onOk={handleModalOk}
                    onCancel={() => {
                        setIsModalVisible(false);
                        form.resetFields();
                        setEditingUser(null);
                    }}
                >
                    <Form
                        form={form}
                        layout="vertical"
                    >
                        <Form.Item
                            name="Username"
                            label="Username"
                            rules={[{ required: true, message: 'Please input username!' }]}
                        >
                            <Input disabled={!!editingUser} />
                        </Form.Item>

                        {!editingUser && (
                            <Form.Item
                                name="Password"
                                label="Password"
                                rules={[
                                    { required: true, message: 'Please input password!' },
                                    { min: 6, message: 'Password must be at least 6 characters!' }
                                ]}
                            >
                                <Input.Password />
                            </Form.Item>
                        )}

                        <Form.Item
                            name="FullName"
                            label="Full Name"
                            rules={[{ required: true, message: 'Please input full name!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="Email"
                            label="Email"
                            rules={[
                                { required: true, message: 'Please input email!' },
                                { type: 'email', message: 'Please enter a valid email!' }
                            ]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="Role"
                            label="Role"
                            rules={[{ required: true, message: 'Please select role!' }]}
                        >
                            <Select>
                                <Option value="teacher">Teacher</Option>
                                <Option value="student">Student</Option>
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

export default UserManagement; 