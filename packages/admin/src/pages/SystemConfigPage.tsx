import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Button, Card, message, Spin } from 'antd';
import { getSystemConfig, updateSystemConfig, SystemConfig } from '../services/api';

const SystemConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const config = await getSystemConfig();
      form.setFieldsValue(config);
    } catch (error) {
      message.error('获取系统配置失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: Partial<SystemConfig>) => {
    try {
      setSubmitting(true);
      await updateSystemConfig(values);
      message.success('系统配置更新成功');
    } catch (error) {
      message.error('更新系统配置失败');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">系统配置</h1>
      <Card title="广告与复活设置" bordered={false} className="max-w-2xl">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            adDurationSeconds: 15,
            dailyReviveLimit: 3,
          }}
        >
          <Form.Item
            name="adVideoUrl"
            label="广告视频 URL"
            rules={[
              { required: true, message: '请输入广告视频 URL' },
              { type: 'url', message: '请输入有效的 URL' },
            ]}
            extra="用于前端播放的广告视频链接 (MP4)"
          >
            <Input placeholder="https://example.com/ad.mp4" />
          </Form.Item>

          <Form.Item
            name="adDurationSeconds"
            label="广告时长 (秒)"
            rules={[{ required: true, message: '请输入广告时长' }]}
            extra="用户必须观看的最短时长"
          >
            <InputNumber min={5} max={60} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="dailyReviveLimit"
            label="每日复活次数限制"
            rules={[{ required: true, message: '请输入每日复活次数限制' }]}
            extra="每个用户每天可以通过看广告复活的最大次数"
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="dailyResetHour"
            label="每日重置时间 (小时)"
            rules={[{ required: true, message: '请输入每日重置时间' }]}
            extra="用户道具重置的时间点 (0-23), 例如 0 表示午夜, 4 表示凌晨4点"
          >
            <InputNumber min={0} max={23} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              保存配置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SystemConfigPage;
