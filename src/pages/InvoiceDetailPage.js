import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Row, Col, Descriptions, Table, Button, Select,
  Typography, Space, Spin, Alert, Tag, Popconfirm, message,
  Tooltip, Form, Input, InputNumber, DatePicker,
} from 'antd';
import {
  ArrowLeftOutlined, ReloadOutlined, CheckCircleOutlined,
  DownloadOutlined, DeleteOutlined, EditOutlined, SaveOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  getInvoice, updateInvoiceStatus, retryInvoice,
  deleteInvoice, updateInvoice,
} from '../api/invoiceApi';
import { InvoiceStatusBadge, ProcessingStatusBadge, ConfidenceScore } from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const fmt     = (v) => v != null ? parseFloat(v).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—';
const fmtDate = (d) => d ? dayjs(d).format('DD MMM YYYY') : '—';

// Admin-only statuses for the status-change control
const ADMIN_STATUSES = ['APPROVED', 'REJECTED', 'PAID'];

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [invoice, setInvoice]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing]   = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getInvoice(id);
      setInvoice(data.data);
      setNewStatus(data.data.status);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load invoice');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh while AI is still processing
  useEffect(() => {
    if (!invoice || !['UPLOADED', 'EXTRACTING', 'AI_PROCESSING'].includes(invoice.processingStatus)) return;
    const t = setTimeout(load, 5000);
    return () => clearTimeout(t);
  }, [invoice, load]);

  const handleStatusUpdate = async () => {
    setUpdating(true);
    try {
      const { data } = await updateInvoiceStatus(id, newStatus);
      setInvoice(data.data);
      message.success(`Status updated to ${newStatus}`);
    } catch { message.error('Status update failed'); }
    finally   { setUpdating(false); }
  };

  const handleRetry = async () => {
    try   { await retryInvoice(id); message.success('Re-triggered AI processing'); setTimeout(load, 1000); }
    catch { message.error('Retry failed'); }
  };

  const handleDelete = async () => {
    try   { await deleteInvoice(id); message.success('Invoice deleted'); navigate('/invoices'); }
    catch { message.error('Delete failed'); }
  };

  const startEdit = () => {
    form.setFieldsValue({
      invoiceNumber: invoice.invoiceNumber,
      vendorName:    invoice.vendorName,
      vendorAddress: invoice.vendorAddress,
      amount:        invoice.amount,
      invoiceDate:   invoice.invoiceDate ? dayjs(invoice.invoiceDate) : null,
      comments:      invoice.comments,
    });
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      const vals = await form.validateFields();
      const payload = {
        ...vals,
        invoiceDate: vals.invoiceDate ? vals.invoiceDate.format('YYYY-MM-DD') : undefined,
      };
      const { data } = await updateInvoice(id, payload);
      setInvoice(data.data);
      setEditing(false);
      message.success('Invoice updated');
    } catch (e) {
      if (e.errorFields) return; // validation error
      message.error(e.response?.data?.message || 'Update failed');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', paddingTop: 80 }}><Spin size="large" /></div>;
  if (error)   return <Alert type="error" message={error} showIcon
                        action={<Button onClick={() => navigate(-1)}>Back</Button>} />;

  const detailColumns = [
    { title: '#',              key: 'idx',  width: 50, render: (_, __, i) => i + 1 },
    { title: 'Item Description', dataIndex: 'itemDescription', ellipsis: true },
    { title: 'Qty',            dataIndex: 'quantity',   width: 80,  render: v => v ?? '—' },
    { title: 'Unit Price',     dataIndex: 'unitPrice',  width: 110, render: v => fmt(v) },
    { title: 'Total Price',    dataIndex: 'totalPrice', width: 110, render: v => fmt(v) },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Back</Button>
          <Title level={4} style={{ margin: 0 }}>
            {invoice.invoiceNumber ? `Invoice ${invoice.invoiceNumber}` : `Invoice #${invoice.invoiceId}`}
          </Title>
          <InvoiceStatusBadge status={invoice.status} />
          <ProcessingStatusBadge status={invoice.processingStatus} />
        </Space>
        <Space>
          {invoice.processingStatus === 'FAILED' && (
            <Button icon={<ReloadOutlined />} onClick={handleRetry}>Retry AI</Button>
          )}
          {invoice.downloadUrl && (
            <Tooltip title="Download original file">
              <Button icon={<DownloadOutlined />} href={invoice.downloadUrl} target="_blank">Download</Button>
            </Tooltip>
          )}
          {/* Admin-only actions */}
          {isAdmin && !editing && (
            <Button icon={<EditOutlined />} onClick={startEdit}>Edit</Button>
          )}
          {isAdmin && editing && (
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveEdit}>Save</Button>
          )}
          {isAdmin && editing && (
            <Button onClick={() => setEditing(false)}>Cancel</Button>
          )}
          {isAdmin && (
            <Popconfirm title="Permanently delete this invoice?" onConfirm={handleDelete}>
              <Button danger icon={<DeleteOutlined />}>Delete</Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {/* Left column */}
        <Col xs={24} lg={8}>

          <Card title="📄 Invoice Information" style={{ borderRadius: 12, marginBottom: 16 }}>
            {editing ? (
              <Form form={form} layout="vertical" size="small">
                <Form.Item label="Invoice #" name="invoiceNumber">
                  <Input />
                </Form.Item>
                <Form.Item label="Invoice Date" name="invoiceDate">
                  <DatePicker style={{ width: '100%' }} disabledDate={d => d && d.isAfter(dayjs())} />
                </Form.Item>
                <Form.Item label="Amount" name="amount"
                  rules={[{ type: 'number', min: 0.01, message: 'Must be positive' }]}>
                  <InputNumber style={{ width: '100%' }} min={0.01} precision={2} />
                </Form.Item>
                <Form.Item label="Vendor Name" name="vendorName">
                  <Input />
                </Form.Item>
                <Form.Item label="Vendor Address" name="vendorAddress">
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Form.Item label="Comments" name="comments">
                  <Input.TextArea rows={2} />
                </Form.Item>
              </Form>
            ) : (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Invoice #">{invoice.invoiceNumber || '—'}</Descriptions.Item>
                <Descriptions.Item label="Invoice Date">{fmtDate(invoice.invoiceDate)}</Descriptions.Item>
                <Descriptions.Item label="Amount">
                  <Text strong style={{ color: '#1677ff', fontSize: 15 }}>{fmt(invoice.amount)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Vendor">{invoice.vendorName || '—'}</Descriptions.Item>
                <Descriptions.Item label="Vendor Address">{invoice.vendorAddress || '—'}</Descriptions.Item>
                <Descriptions.Item label="Comments">{invoice.comments || '—'}</Descriptions.Item>
                <Descriptions.Item label="Uploaded By">{invoice.uploadedByEmail || '—'}</Descriptions.Item>
                <Descriptions.Item label="Uploaded At">
                  {dayjs(invoice.createdAt).format('DD MMM YYYY HH:mm')}
                </Descriptions.Item>
              </Descriptions>
            )}
          </Card>

          <Card title="🤖 AI Processing" style={{ borderRadius: 12, marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="File">{invoice.originalFileName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Type"><Tag>{invoice.fileType || '—'}</Tag></Descriptions.Item>
              <Descriptions.Item label="Size">
                {invoice.fileSizeBytes ? `${(invoice.fileSizeBytes / 1024).toFixed(1)} KB` : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="AI Model">{invoice.aiModelUsed || '—'}</Descriptions.Item>
              <Descriptions.Item label="Confidence">
                <ConfidenceScore score={invoice.aiConfidenceScore} />
              </Descriptions.Item>
              <Descriptions.Item label="Duration">
                {invoice.processingDurationMs ? `${invoice.processingDurationMs} ms` : '—'}
              </Descriptions.Item>
              {invoice.processingError && (
                <Descriptions.Item label="Error">
                  <Text type="danger" style={{ fontSize: 12 }}>{invoice.processingError}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Admin-only status update */}
          {isAdmin && (
            <Card title="✅ Update Status" style={{ borderRadius: 12 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Select value={newStatus} onChange={setNewStatus} style={{ width: '100%' }}>
                  {ADMIN_STATUSES.map(s => <Option key={s} value={s}>{s}</Option>)}
                </Select>
                <Button type="primary" icon={<CheckCircleOutlined />}
                  onClick={handleStatusUpdate} loading={updating}
                  disabled={newStatus === invoice.status}>
                  Update Status
                </Button>
                {invoice.reviewedBy && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Reviewed by <strong>{invoice.reviewedBy}</strong> on {fmtDate(invoice.reviewedAt)}
                  </Text>
                )}
              </Space>
            </Card>
          )}
        </Col>

        {/* Right column — line items */}
        <Col xs={24} lg={16}>
          <Card
            title={`📦 Line Items${invoice.details?.length ? ` (${invoice.details.length})` : ''}`}
            style={{ borderRadius: 12 }}
          >
            {invoice.details && invoice.details.length > 0 ? (
              <Table
                columns={detailColumns}
                dataSource={invoice.details}
                rowKey="detailId"
                pagination={false}
                size="small"
                scroll={{ x: 600 }}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={4} align="right">
                      <Text strong>Total</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell>
                      <Text strong style={{ color: '#1677ff' }}>
                        {fmt(invoice.details.reduce((s, d) => s + (parseFloat(d.totalPrice) || 0), 0))}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            ) : (
              <Text type="secondary">
                {['UPLOADED', 'EXTRACTING', 'AI_PROCESSING'].includes(invoice.processingStatus)
                  ? '⏳ AI is extracting line items — page auto-refreshes every 5 seconds…'
                  : 'No line items extracted from this invoice.'}
              </Text>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
