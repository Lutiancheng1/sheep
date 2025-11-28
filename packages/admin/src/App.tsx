import { useState } from 'react'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <div style={{ padding: '20px' }}>
        <h1>羊了个羊 - 管理后台</h1>
        <p>正在初始化...</p>
      </div>
    </ConfigProvider>
  )
}

export default App
