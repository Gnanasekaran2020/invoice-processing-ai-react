import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Table, Button, Spin, Alert, Tag } from 'antd';
import {
  FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined,
  SyncOutlined, CloseCircleOutlined, UploadOutlined, DollarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getDashboardStats, listInvoices } from '../api/invoiceApi';
import { InvoiceStatusBadge, ProcessingStatusBadge } from '../components/common/StatusBadge';
import { DUMMY_STATS, DUMMY_INVOICES, DUMMY_MONTHLY_TREND } from '../data/dummyData';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const [stats, setStats]     = useState(null);
  const [recent, setRecent]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [usingDummy, setUsingDummy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      getDashboardStats().catch(() => null),
      listInvoices({ page: 0, size: 5 }).catch(() => null),
    ])
      .then(([s, r]) => {
        const statsData  = s?.data?.data;
        const listData   = r?.data?.data?.content || [];

        if (statsData) {
          setStats(statsData);
        } else {
          setStats(DUMMY_STATS);
          setUsingDummy(true);
        }

        if (listData.length > 0) {
          setRecent(listData);
        } else {
          setRecent(DUMMY_INVOICES.slice(0, 5));
          setUsingDummy(true);
        }
      })
      .catch((e) => {
        setError(e.message);
        setStats(DUMMY_STATS);
        setRecent(DUMMY_INVOICES.slice(0, 5));
        setUsingDummy(true);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', paddingTop: 80 }}><Spin size="large" /></div>;
  if (error)   return <Alert type="error" message={error} showIcon />;

  const byStatus     = stats?.byStatus        || {};
  const byProcessing = stats?.byProcessingStatus || {};

  const statCards = [
    { title: 'Total Invoices', value: stats?.totalInvoices || 0,       icon: <FileTextOutlined />,   color: '#1677ff' },
    { title: 'Approved',       value: byStatus.APPROVED    || 0,       icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: 'Pending',        value: byStatus.PENDING     || 0,       icon: <ClockCircleOutlined />, color: '#faad14' },
    { title: 'AI Processing',
      value: (byProcessing.AI_PROCESSING || 0) + (byProcessing.EXTRACTING || 0),
      icon: <SyncOutlined />, color: '#722ed1' },
    { title: 'Failed',         value: byProcessing.FAILED  || 0,       icon: <CloseCircleOutlined />, color: '#ff4d4f' },
  ];

  const columns = [
    {
      title: 'Invoice #', dataIndex: 'invoiceNumber', width: 140,
      render: (v, r) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/invoices/${r.invoiceId}`)}>
          {v || `#${r.invoiceId}`}
        </Button>
      ),
    },
    { title: 'Vendor',       dataIndex: 'vendorName',    render: v => v || '—', ellipsis: true },
    { title: 'Invoice Date', dataIndex: 'invoiceDate',   render: d => d ? dayjs(d).format('DD MMM YYYY') : '—', width: 120 },
    { title: 'Amount',       dataIndex: 'amount',
      render: v => v != null ? `$${parseFloat(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—', width: 130 },
    { title: 'Status',       dataIndex: 'status',           render: s => <InvoiceStatusBadge status={s} />, width: 120 },
    { title: 'AI Status',    dataIndex: 'processingStatus', render: s => <ProcessingStatusBadge status={s} />, width: 150 },
  ];

  // Monthly trend mini-table
  const trendColumns = [
    { title: 'Month',    dataIndex: 'month',    width: 70 },
    { title: 'Total ($)',dataIndex: 'total',    render: v => `$${v.toLocaleString()}`, width: 110 },
    { title: 'Approved', dataIndex: 'approved', render: v => <Text style={{ color:'#52c41a' }}>${v.toLocaleString()}</Text>, width: 110 },
    { title: 'Pending',  dataIndex: 'pending',  render: v => <Text style={{ color:'#faad14' }}>${v.toLocaleString()}</Text>, width: 100 },
    { title: 'Rejected', dataIndex: 'rejected', render: v => <Text style={{ color:'#ff4d4f' }}>${v.toLocaleString()}</Text>, width: 100 },
  ];

  return (
    <div>
      {error && <Alert type="warning" message="Backend unavailable — showing sample data" showIcon style={{ marginBottom: 16 }} />}
      {usingDummy && !error && (
        <Alert type="info" message="Showing sample / demo data" showIcon style={{ marginBottom: 16 }} />
      )}

      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>Dashboard</Title>
        <Button type="primary" icon={<UploadOutlined />} onClick={() => navigate('/upload')}>
          Upload Invoice
        </Button>
      </div>

      {/* KPI cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
        {statCards.map((s) => (
          <Col xs={24} sm={12} lg={5} key={s.title}>
            <Card className="stat-card">
              <Statistic
                title={s.title}
                value={s.value}
                prefix={React.cloneElement(s.icon, { style: { color: s.color } })}
                valueStyle={{ color: s.color, fontSize: 28 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Status breakdown pills */}
      <Card title="Invoice Status Breakdown" style={{ borderRadius: 12, marginBottom: 20 }}>
        <Row gutter={[12, 12]}>
          {Object.entries(byStatus).map(([k, v]) => (
            <Col key={k}>
              <Tag color={
                k === 'APPROVED' ? 'green' : k === 'PENDING' ? 'gold' :
                k === 'REJECTED' ? 'red'   : k === 'PAID'    ? 'blue' : 'default'
              } style={{ fontSize: 14, padding: '4px 12px' }}>
                {k}: <strong>{v}</strong>
              </Tag>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Monthly trend */}
      <Card title="Monthly Invoice Trend" style={{ borderRadius: 12, marginBottom: 20 }}>
        <Table
          columns={trendColumns}
          dataSource={DUMMY_MONTHLY_TREND}
          rowKey="month"
          pagination={false}
          size="small"
        />
      </Card>

      {/* Recent invoices */}
      <Card
        title="Recent Invoices"
        extra={<Button type="link" onClick={() => navigate('/invoices')}>View All →</Button>}
        style={{ borderRadius: 12 }}
      >
        <Table
          className="invoice-table"
          columns={columns}
          dataSource={recent}
          rowKey="invoiceId"
          pagination={false}
          size="small"
          onRow={(r) => ({ onClick: () => navigate(`/invoices/${r.invoiceId}`) })}
        />
      </Card>
    </div>
  );
}
