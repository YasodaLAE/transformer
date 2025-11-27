import React from 'react';


const getStatusBadgeColor = (status) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-primary';
    case 'in progress':
      return 'bg-success';
    case 'pending':
      return 'bg-danger';
    default:
      return 'bg-secondary';
  }
};


const StatusBadge = ({ status }) => {
  const badgeClass = `badge rounded-pill text-white ${getStatusBadgeColor(status)}`;
  return <span className={badgeClass}>{status}</span>;
};


export default StatusBadge;
