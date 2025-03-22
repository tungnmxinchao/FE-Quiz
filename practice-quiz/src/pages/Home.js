import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Input, Select, Pagination, Typography, Space, Button } from 'antd';
import { BookOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { getODataURL } from '../config/api.config';
import MainLayout from '../components/Layout/MainLayout';
import './Home.css';

const { Title, Text } = Typography;
const { Search } = Input;

const Home = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchText, setSearchText] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const skip = (currentPage - 1) * pageSize;
            let url = `${getODataURL('/Subject')}?$count=true&$skip=${skip}&$top=${pageSize}`;

            // Add filter if search text exists
            if (searchText) {
                url += `&$filter=contains(SubjectName, '${searchText}')`;
            }

            // Add sorting
            url += `&$orderby=CreatedAt ${sortOrder}`;

            const response = await fetch(url);
            const data = await response.json();
            setSubjects(data.value);
            setTotal(data['@odata.count']);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, [currentPage, pageSize, searchText, sortOrder]);

    const handleSearch = (value) => {
        setSearchText(value);
        setCurrentPage(1);
    };

    const handleSortChange = (value) => {
        setSortOrder(value);
        setCurrentPage(1);
    };

    return (
        <MainLayout>
            <div className="home-container">
                <div className="home-header">
                    <Title level={2}>Explore Subjects</Title>
                    <Text className="subtitle">Discover and practice various subjects to enhance your knowledge</Text>
                </div>

                <div className="search-section">
                    <Space size="large">
                        <Search
                            placeholder="Search by subject name"
                            allowClear
                            onSearch={handleSearch}
                            style={{ width: 300 }}
                            className="search-input"
                        />
                        <Select
                            defaultValue="desc"
                            style={{ width: 200 }}
                            onChange={handleSortChange}
                            options={[
                                { value: 'desc', label: 'Newest First' },
                                { value: 'asc', label: 'Oldest First' },
                            ]}
                            className="sort-select"
                        />
                    </Space>
                </div>

                <Row gutter={[24, 24]}>
                    {subjects.map((subject) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={subject.SubjectId}>
                            <Card
                                hoverable
                                loading={loading}
                                className="subject-card"
                                actions={[
                                    <Button type="primary" className="practice-button">
                                        Start Practice
                                    </Button>
                                ]}
                            >
                                <div className="card-icon">
                                    <BookOutlined />
                                </div>
                                <Title level={4} className="card-title">{subject.SubjectName}</Title>
                                <Text className="card-description">{subject.Description}</Text>
                                <div className="card-meta">
                                    <Space>
                                        <UserOutlined />
                                        <Text>{subject.CreatedByUser.FullName}</Text>
                                    </Space>
                                    <Space>
                                        <ClockCircleOutlined />
                                        <Text>{new Date(subject.CreatedAt).toLocaleDateString()}</Text>
                                    </Space>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>

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
                        showTotal={(total) => `Total ${total} items`}
                    />
                </div>
            </div>
        </MainLayout>
    );
};

export default Home; 