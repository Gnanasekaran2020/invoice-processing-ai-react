import React from 'react';
import { Tag } from 'antd';
import {
  ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SyncOutlined, EyeOutlined, DollarOutlined, WarningOutlined,
} from '@ant-design/icons';

const INVOICE_STATUS_CONFIG = {
  PENDING:   { color: 'orange',  icon: <ClockCircleOutlined />,  label: 'Pending' },
  APPROVED:  { color: 'green',   icon: <CheckCircleOutlined />,  label: 'Approved' },
  REJECTED:  { color: 'red',     icon: <CloseCircleOutlined />,  label: 'Rejected' },
  DUPLICATE: { color: 'purple',  icon: <WarningOutlined />,      label: 'Duplicate' },
  PAID:      { color: 'cyan',    icon: <DollarOutlined />,       label: 'Paid' },
};

const PROCESSING_STATUS_CONFIG = {
  UPLOADED:      { color: 'default', icon: <ClockCircleOutlined />, label: 'Uploaded' },
  EXTRACTING:    { color: 'blue',    icon: <SyncOutlined spin />,   label: 'Extracting' },
  AI_PROCESSING: { color: 'blue',    icon: <SyncOutlined spin />,   label: 'AI Processing' },
  COMPLETED:     { color: 'green',   icon: <CheckCircleOutlined />, label: 'Completed' },
  FAILED:        { color: 'red',     icon: <CloseCircleOutlined />, label: 'Failed' },
  MANUAL_REVIEW: { color: 'orange',  icon: <EyeOutlined />,         label: 'Manual Review' },
};

export function InvoiceStatusBadge({ status }) {
  const cfg = INVOICE_STATUS_CONFIG[status] || { color: 'default', label: status };
  return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>;
}

export function ProcessingStatusBadge({ status }) {
  const cfg = PROCESSING_STATUS_CONFIG[status] || { color: 'default', label: status };
  return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>;
}

export function ConfidenceScore({ score }) {
  if (score == null) return <span>—</span>;
  const num = parseFloat(score);
  const cls = num >= 80 ? 'confidence-high' : num >= 60 ? 'confidence-mid' : 'confidence-low';
  return <span className={cls}>{num.toFixed(1)}%</span>;
}

