import React, { useMemo } from 'react';
import { Breadcrumb as AntBreadcrumb } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pathMap: Record<string, string> = {
    '/levels': '关卡管理',
    '/users': '用户管理',
    '/logs': '日志审计',
  };

  const breadcrumbItems = useMemo(() => {
    const pathSnippets = location.pathname.split('/').filter((i) => i);

    // 首页
    const items = [
      {
        title: (
          <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <HomeOutlined />
          </span>
        ),
      },
    ];

    // 构建路径breadcrumbs
    pathSnippets.forEach((snippet, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
      const isLast = index === pathSnippets.length - 1;

      // 检查是否是已知路由
      if (pathMap[url]) {
        items.push({
          title: isLast ? (
            <>{pathMap[url]}</>
          ) : (
            <span onClick={() => navigate(url)} style={{ cursor: 'pointer' }}>
              {pathMap[url]}
            </span>
          ),
        });
      } else {
        // 处理动态路由 (如 /levels/level-1 或 /levels/new)
        if (snippet === 'new') {
          items.push({
            title: <>新建关卡</>,
          });
        } else if (snippet.startsWith('level-')) {
          items.push({
            title: <>编辑关卡 ({snippet})</>,
          });
        } else {
          // 其他未知路由
          items.push({
            title: <>{snippet}</>,
          });
        }
      }
    });

    return items;
  }, [location, navigate]);

  return <AntBreadcrumb items={breadcrumbItems} style={{ marginBottom: 16, marginLeft: 50 }} />;
};

export default Breadcrumb;
