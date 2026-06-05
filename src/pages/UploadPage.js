import React, { useState } from 'react';
import {
  Card, Upload, Button, Form, Input, Alert, Typography,
  Progress, Steps, Result, Space, Tag,
} from 'antd';
import {
  InboxOutlined, FilePdfOutlined, FileImageOutlined,
  CheckCircleOutlined, SyncOutlined, EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { uploadInvoice } from '../api/invoiceApi';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff', 'image/webp'];
const MAX_SIZE_MB   = 20;

export default function UploadPage() {
  const [file, setFile]           = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const beforeUpload = (f) => {
    setError('');
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError(`Unsupported file type: ${f.type}. Allowed: PDF, JPEG, PNG, TIFF, WEBP`);
      return false;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File size exceeds ${MAX_SIZE_MB}MB limit.`);
      return false;
    }
    setFile(f);
    return false; // prevent auto-upload
  };

  const handleUpload = async () => {
    if (!file) { setError('Please select a file first.'); return; }
    setError('');
    setUploading(true);
    try {
      const notes = form.getFieldValue('notes');
      const fd    = new FormData();
      fd.append('file', file);
      if (notes) fd.append('notes', notes);

      const { data } = await uploadInvoice(fd);
      setResult(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => { setFile(null); setResult(null); setError(''); form.resetFields(); };

  if (result) {
    return (
      <Card style={{ borderRadius: 12, maxWidth: 600, margin: '0 auto' }}>
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          title="Invoice Uploaded Successfully!"
          subTitle={
            <Space direction="vertical" style={{ textAlign: 'left', marginTop: 12 }}>
              <Text>File: <strong>{result.originalFileName}</strong></Text>
              <Text>Status: <Tag color="blue" icon={<SyncOutlined spin />}>AI Processing Started</Tag></Text>
              <Text type="secondary">
                The AI is now extracting data from your document. This usually takes 10–30 seconds.
              </Text>
            </Space>
          }
          extra={[
            <Button type="primary" key="view" icon={<EyeOutlined />} onClick={() => navigate(`/invoices/${result.id}`)}>
              View Invoice
            </Button>,
            <Button key="another" onClick={reset}>Upload Another</Button>,
            <Button key="list" onClick={() => navigate('/invoices')}>View All Invoices</Button>,
          ]}
        />
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>Upload Invoice</Title>
      </div>

      <Steps
        style={{ marginBottom: 28 }}
        items={[
          { title: 'Select File',   description: 'PDF or Image' },
          { title: 'AI Extraction', description: 'Automated parsing' },
          { title: 'Review',        description: 'Verify & approve' },
        ]}
        current={0}
      />

      <Card style={{ borderRadius: 12 }}>
        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

        <Dragger
          className="upload-dragger"
          beforeUpload={beforeUpload}
          fileList={file ? [file] : []}
          onRemove={() => setFile(null)}
          maxCount={1}
          accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif,.webp"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ color: '#1677ff', fontSize: 48 }} />
          </p>
          <p className="ant-upload-text">Click or drag invoice file to upload</p>
          <p className="ant-upload-hint">
            Supported formats: <strong>PDF, JPEG, PNG, TIFF, WEBP</strong> — Max size: <strong>20MB</strong>
          </p>
          <div style={{ marginTop: 12 }}>
            <Tag icon={<FilePdfOutlined />} color="red">PDF</Tag>
            <Tag icon={<FileImageOutlined />} color="blue">JPEG</Tag>
            <Tag icon={<FileImageOutlined />} color="green">PNG</Tag>
            <Tag icon={<FileImageOutlined />} color="orange">TIFF</Tag>
          </div>
        </Dragger>

        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item name="notes" label="Notes (Optional)">
            <Input.TextArea rows={2} placeholder="Add any notes about this invoice..." maxLength={500} />
          </Form.Item>
        </Form>

        {uploading && (
          <div style={{ marginBottom: 16 }}>
            <Progress percent={99} status="active" strokeColor="#1677ff" />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Uploading and triggering AI extraction...
            </Text>
          </div>
        )}

        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={reset} disabled={uploading}>Clear</Button>
          <Button
            type="primary"
            onClick={handleUpload}
            loading={uploading}
            disabled={!file}
            size="large"
            icon={<CheckCircleOutlined />}
          >
            Upload &amp; Process
          </Button>
        </Space>

        <Paragraph type="secondary" style={{ marginTop: 16, fontSize: 12 }}>
          <strong>How it works:</strong> After upload, our AI (GPT-4o Vision) automatically extracts
          all invoice fields — vendor, amounts, line items, dates and more — within seconds.
          Low-confidence results are flagged for manual review.
        </Paragraph>
      </Card>
    </div>
  );
}

