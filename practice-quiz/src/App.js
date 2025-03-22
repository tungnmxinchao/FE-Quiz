import React from 'react';
import { Button, Space } from 'antd';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Space direction="vertical" size="large">
          <h1>Welcome to React with Ant Design</h1>
          <Button type="primary">Click me!</Button>
        </Space>
      </header>
    </div>
  );
}

export default App;
