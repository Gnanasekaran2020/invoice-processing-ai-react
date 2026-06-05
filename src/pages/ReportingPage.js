import React, { useState } from 'react';
import {
  Card, Form, Select, DatePicker, Button, Space, Typography,
  Radio, Alert, Divider, message, Table, Tag, Row, Col, Statistic,
} from 'antd';
import { DownloadOutlined, BarChartOutlined, FileExcelOutlined, FilePdfOutlined, FileTextOutlined } from '@ant-design/icons';
import { generateReport } from '../api/reportApi';
import { useAuth } from '../context/AuthContext';
import { DUMMY_REPORT_ROWS, DUMMY_MONTHLY_TREND, DUMMY_STATS } from '../data/dummyData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const FORMAT_OPTIONS = [
  { value: 'pdf',   label: 'PDF',   icon: <FilePdfOutlined style={{ color: '#f5222d' }} />,  ext: 'pdf',  mime: 'application/pdf' },
  { value: 'excel', label: 'Excel', icon: <FileExcelOutlined style={{ color: '#52c41a' }} />, ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { value: 'csv',   label: 'CSV',   icon: <FileTextOutlined style={{ color: '#1677ff' }} />,  ext: 'csv',  mime: 'text/csv' },
];

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'DUPLICATE', 'PAID'];

const STATUS_COLOR = { APPROVED: 'green', PENDING: 'gold', REJECTED: 'red', DUPLICATE: 'orange', PAID: 'blue' };

const previewColumns = [
  { title: 'Invoice #', dataIndex: 'invoiceNumber', width: 140 },
  { title: 'Vendor',    dataIndex: 'vendor',         ellipsis: true },
  { title: 'Date',      dataIndex: 'date',           width: 110 },
  { title: 'Amount',    dataIndex: 'amount',         width: 120,
    render: v => `$${parseFloat(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
  { title: 'Status',    dataIndex: 'status',         width: 110,
    render: s => <Tag color={STATUS_COLOR[s] || 'default'}>{s}</Tag> },
];

const trendColumns = [
  { title: 'Month',    dataIndex: 'month',    width: 70 },
  { title: 'Total',    dataIndex: 'total',    render: v => `$${v.toLocaleString()}` },
  { title: 'Approved', dataIndex: 'approved', render: v => <Text style={{ color:'#52c41a' }}>${v.toLocaleString()}</Text> },
  { title: 'Pending',  dataIndex: 'pending',  render: v => <Text style={{ color:'#faad14' }}>${v.toLocaleString()}</Text> },
  { title: 'Rejected', dataIndex: 'rejected', render: v => <Text style={{ color:'#ff4d4f' }}>${v.toLocaleString()}</Text> },
];

export default function ReportingPage() {
  const { isAdmin } = useAuth();
  const [form]       = Form.useForm();
  const [generating, setGenerating] = useState(false);
  const [lastReport, setLastReport] = useState(null);
  const [previewRows, setPreviewRows] = useState(DUMMY_REPORT_ROWS);

  // Filter preview data client-side
  const handlePreviewFilter = () => {
    const values = form.getFieldsValue();
    let data = [...DUMMY_REPORT_ROWS];
    if (values.status)       data = data.filter(r => r.status === values.status);
    if (values.dateRange?.[0]) data = data.filter(r => r.date >= values.dateRange[0].format('YYYY-MM-DD'));
    if (values.dateRange?.[1]) data = data.filter(r => r.date <= values.dateRange[1].format('YYYY-MM-DD'));
    setPreviewRows(data);
  };

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields();
      setGenerating(true);

      const params = {
        format:   values.format,
        status:   values.status || undefined,
        fromDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
        toDate:   values.dateRange?.[1]?.format('YYYY-MM-DD'),
      };

      const response = await generateReport(params);
      const fmt      = FORMAT_OPTIONS.find(f => f.value === values.format);
      const filename = `invoice-report-${new Date().toISOString().slice(0,10)}.${fmt.ext}`;

      const url  = window.URL.createObjectURL(new Blob([response.data], { type: fmt.mime }));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setLastReport({ filename, format: values.format, generatedAt: new Date().toLocaleString() });
      message.success(`${fmt.label} report downloaded: ${filename}`);
    } catch (e) {
      if (e.errorFields) return;
      const errMsg = e.response?.data
        ? new TextDecoder().decode(await e.response.data.arrayBuffer?.() || new ArrayBuffer(0))
        : e.message;
      message.error('Report generation failed: ' + (errMsg || 'Unknown error'));
    } finally { setGenerating(false); }
  };

  const totalPreviewAmount = previewRows.reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <Space>
          <BarChartOutlined style={{ fontSize: 20 }} />
          <Title level={3} style={{ margin: 0 }}>Reports</Title>
        </Space>
      </div>

      {isAdmin && (
        <Alert
          message="Admin Mode"
          description="As an administrator you can see reports covering all users' invoices."
          type="info" showIcon style={{ marginBottom: 16 }}
        />
      )}

      {/* KPI summary */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Invoices', value: DUMMY_STATS.totalInvoices, color: '#1677ff' },
          { label: 'Approved',       value: DUMMY_STATS.byStatus.APPROVED, color: '#52c41a' },
          { label: 'Pending',        value: DUMMY_STATS.byStatus.PENDING,  color: '#faad14' },
          { label: 'Rejected',       value: DUMMY_STATS.byStatus.REJECTED, color: '#ff4d4f' },
          { label: 'Paid',           value: DUMMY_STATS.byStatus.PAID,     color: '#1890ff' },
        ].map(s => (
          <Col xs={12} sm={8} md={4} key={s.label}>
            <Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}>
              <Statistic title={s.label} value={s.value} valueStyle={{ color: s.color, fontSize: 20 }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        {/* Report generator */}
        <Col xs={24} md={10}>
          <Card title="Generate Report" style={{ borderRadius: 12, marginBottom: 16 }}>
            <Form form={form} layout="vertical" initialValues={{ format: 'pdf' }}
              onValuesChange={handlePreviewFilter}>

              <Form.Item label="Export Format" name="format" rules={[{ required: true }]}>
                <Radio.Group buttonStyle="solid">
                  {FORMAT_OPTIONS.map(f => (
                    <Radio.Button key={f.value} value={f.value}>{f.icon} {f.label}</Radio.Button>
                  ))}
                </Radio.Group>
              </Form.Item>

              <Form.Item label="Date Range" name="dateRange">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item label="Filter by Status" name="status">
                <Select placeholder="All statuses" allowClear style={{ width: '100%' }}>
                  {STATUSES.map(s => <Option key={s} value={s}>{s}</Option>)}
                </Select>
              </Form.Item>

              <Divider />

              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" icon={<DownloadOutlined />} onClick={handleGenerate}
                  loading={generating} size="large" block>
                  {generating ? 'Generating…' : 'Generate & Download Report'}
                </Button>
              </Form.Item>
            </Form>

            {lastReport && (
              <Alert style={{ marginTop: 16 }} type="success"
                message={`Last report: ${lastReport.filename}`}
                description={<Text type="secondary">Generated at {lastReport.generatedAt}</Text>}
                showIcon />
            )}
          </Card>
        </Col>

        {/* Right column: preview + trend */}
        <Col xs={24} md={14}>
          <Card
            title={`Invoice Preview (${previewRows.length} records — $${totalPreviewAmount.toLocaleString(undefined,{minimumFractionDigits:2})})`}
            style={{ borderRadius: 12, marginBottom: 16 }}
            extra={<Text type="secondary">Sample data</Text>}
          >
            <Table
              columns={previewColumns}
              dataSource={previewRows}
              rowKey="key"
              pagination={{ pageSize: 5, showSizeChanger: false }}
              size="small"
            />
          </Card>

          <Card title="Monthly Trend" style={{ borderRadius: 12 }}>
            <Table
              columns={trendColumns}
              dataSource={DUMMY_MONTHLY_TREND}
              rowKey="month"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
