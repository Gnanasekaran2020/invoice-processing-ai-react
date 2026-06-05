import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Input, Select, Space, Typography,
  DatePicker, Tooltip, Popconfirm, message, Alert, Tag, Statistic, Row, Col,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, EyeOutlined, DeleteOutlined, UploadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { listInvoices, deleteInvoice, retryInvoice } from '../api/invoiceApi';
import { InvoiceStatusBadge, ProcessingStatusBadge, ConfidenceScore } from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { DUMMY_INVOICES } from '../data/dummyData';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const INVOICE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'DUPLICATE', 'PAID'];

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [filters, setFilters]   = useState({ page: 0, size: 15 });
  const [usingDummy, setUsingDummy] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // Client-side filter of dummy data
  const applyDummyFilters = useCallback((params) => {
    let data = [...DUMMY_INVOICES];
    if (params.vendorName) data = data.filter(i => i.vendorName.toLowerCase().includes(params.vendorName.toLowerCase()));
    if (params.status)     data = data.filter(i => i.status === params.status);
    if (params.fromDate)   data = data.filter(i => i.invoiceDate >= params.fromDate);
    if (params.toDate)     data = data.filter(i => i.invoiceDate <= params.toDate);
    const page = params.page || 0;
    const size = params.size || 15;
    return { content: data.slice(page * size, page * size + size), totalElements: data.length };
  }, []);

  const fetchInvoices = useCallback(async (params = filters) => {
    setLoading(true);
    try {
      const { data } = await listInvoices(params);
      const content = data.data.content || [];
      if (content.length > 0) {
        setInvoices(content);
        setTotal(data.data.totalElements || 0);
        setUsingDummy(false);
      } else {
        throw new Error('empty');
      }
    } catch {
      const result = applyDummyFilters(params);
      setInvoices(result.content);
      setTotal(result.totalElements);
      setUsingDummy(true);
    } finally { setLoading(false); }
  }, [filters, applyDummyFilters]);

  useEffect(() => { fetchInvoices(); }, []); // eslint-disable-line

  const handleTableChange = (pagination) => {
    const updated = { ...filters, page: pagination.current - 1, size: pagination.pageSize };
    setFilters(updated);
    fetchInvoices(updated);
  };

  const handleDelete = async (id) => {
    try   { await deleteInvoice(id); message.success('Invoice deleted'); fetchInvoices(); }
    catch { message.error('Delete failed'); }
  };

  const handleRetry = async (id) => {
    try   { await retryInvoice(id); message.success('AI re-triggered'); setTimeout(fetchInvoices, 1000); }
    catch { message.error('Retry failed'); }
  };

  // Summary counts from currently displayed data
  const statusCounts = invoices.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {});

  const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

  const columns = [
    {
      title: 'Invoice #', dataIndex: 'invoiceNumber', width: 140,
      render: (v, r) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/invoices/${r.invoiceId}`)}>
          {v || `#${r.invoiceId}`}
        </Button>
      ),
    },
    { title: 'Vendor',       dataIndex: 'vendorName',  render: v => v || '—', ellipsis: true },
    { title: 'Invoice Date', dataIndex: 'invoiceDate', width: 120,
      render: d => d ? dayjs(d).format('DD MMM YYYY') : '—' },
    { title: 'Due Date',     dataIndex: 'dueDate',     width: 120,
      render: d => d ? dayjs(d).format('DD MMM YYYY') : '—' },
    { title: 'Amount',       dataIndex: 'amount',      width: 130,
      render: v => v != null ? `$${parseFloat(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—' },
    { title: 'Currency',     dataIndex: 'currency',    width: 80, render: v => v || 'USD' },
    { title: 'Status',       dataIndex: 'status',           width: 120, render: s => <InvoiceStatusBadge status={s} /> },
    { title: 'AI Status',    dataIndex: 'processingStatus', width: 150, render: s => <ProcessingStatusBadge status={s} /> },
    { title: 'Confidence',   dataIndex: 'aiConfidenceScore',width: 100, render: s => <ConfidenceScore score={s} /> },
    { title: 'Uploaded',     dataIndex: 'createdAt',        width: 130, render: d => d ? dayjs(d).format('DD MMM YYYY') : '—' },
    {
      title: 'Actions', key: 'actions', width: 120, fixed: 'right',
      render: (_, r) => (
        <Space>
          <Tooltip title="View">
            <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/invoices/${r.invoiceId}`)} />
          </Tooltip>
          {r.processingStatus === 'FAILED' && (
            <Tooltip title="Retry AI">
              <Button size="small" icon={<ReloadOutlined />} onClick={() => handleRetry(r.invoiceId)} />
            </Tooltip>
          )}
          {isAdmin && (
            <Popconfirm title="Delete this invoice?" onConfirm={() => handleDelete(r.invoiceId)}
              okText="Yes" cancelText="No">
              <Tooltip title="Delete">
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {usingDummy && (
        <Alert type="info" message="Showing sample / demo data — backend not reachable" showIcon style={{ marginBottom: 16 }} />
      )}

      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>Invoices</Title>
        <Button type="primary" icon={<UploadOutlined />} onClick={() => navigate('/upload')}>
          Upload Invoice
        </Button>
      </div>

      {/* Quick summary bar */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}>
            <Statistic title="Shown" value={invoices.length} valueStyle={{ fontSize: 20 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}>
            <Statistic title="Total Amount" value={`$${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} valueStyle={{ fontSize: 16, color: '#1677ff' }} />
          </Card>
        </Col>
        {Object.entries(statusCounts).slice(0, 2).map(([k, v]) => (
          <Col xs={12} sm={6} key={k}>
            <Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}>
              <Statistic title={k} value={v} valueStyle={{ fontSize: 20,
                color: k==='APPROVED'?'#52c41a':k==='PENDING'?'#faad14':k==='REJECTED'?'#ff4d4f':'#1677ff' }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <Space wrap>
          <Input prefix={<SearchOutlined />} placeholder="Search vendor…" style={{ width: 200 }} allowClear
            onChange={(e) => setFilters(f => ({ ...f, vendorName: e.target.value || undefined, page: 0 }))}
            onPressEnter={() => fetchInvoices({ ...filters, page: 0 })}
          />
          <Select placeholder="Status" style={{ width: 150 }} allowClear
            onChange={(v) => { const u = { ...filters, status: v, page: 0 }; setFilters(u); fetchInvoices(u); }}>
            {INVOICE_STATUSES.map(s => <Option key={s} value={s}>{s}</Option>)}
          </Select>
          <RangePicker onChange={(dates) => {
            const u = { ...filters,
              fromDate: dates?.[0]?.format('YYYY-MM-DD'),
              toDate:   dates?.[1]?.format('YYYY-MM-DD'),
              page: 0 };
            setFilters(u); fetchInvoices(u);
          }} />
          <Button icon={<ReloadOutlined />} onClick={() => fetchInvoices(filters)}>Refresh</Button>
        </Space>
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Table
          className="invoice-table"
          columns={columns}
          dataSource={invoices}
          rowKey="invoiceId"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            total,
            current: (filters.page || 0) + 1,
            pageSize: filters.size || 15,
            showSizeChanger: true,
            showTotal: t => `Total ${t} invoices`,
          }}
          onChange={handleTableChange}
          onRow={(r) => ({ onDoubleClick: () => navigate(`/invoices/${r.invoiceId}`) })}
        />
      </Card>
    </div>
  );
}
