import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Input, Select, Pagination, Typography, Space } from 'antd';
import { getODataURL } from '../config/api.config';

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
        <div style={{ padding: '24px' }}>
            <Title level={2}>Practice Quizzes</Title>
            <Space style={{ marginBottom: 24 }} size="large">
                <Search
                    placeholder="Search by subject name"
                    allowClear
                    onSearch={handleSearch}
                    style={{ width: 300 }}
                />
                <Select
                    defaultValue="desc"
                    style={{ width: 200 }}
                    onChange={handleSortChange}
                    options={[
                        { value: 'desc', label: 'Newest First' },
                        { value: 'asc', label: 'Oldest First' },
                    ]}
                />
            </Space>

            <Row gutter={[16, 16]}>
                {subjects.map((subject) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={subject.SubjectId}>
                        <Card
                            hoverable
                            loading={loading}
                            style={{ height: '100%' }}
                        >
                            <Title level={4}>{subject.SubjectName}</Title>
                            <Text type="secondary">{subject.Description}</Text>
                            <div style={{ marginTop: 12 }}>
                                <Text type="secondary">
                                    Created by: {subject.CreatedByUser.FullName}
                                </Text>
                            </div>
                            <div>
                                <Text type="secondary">
                                    Created at: {new Date(subject.CreatedAt).toLocaleDateString()}
                                </Text>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
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
    );
};

export default Home; 