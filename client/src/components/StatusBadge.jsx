import React from 'react';


const getStatusBadgeColor = (status) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-primary'; // Bootstrap's default blue
    case 'in progress':
      return 'bg-success'; // Bootstrap's default green
    case 'pending':
      return 'bg-danger'; // Bootstrap's default red
    default:
      return 'bg-secondary'; // A neutral color for unknown statuses
  }
};


const StatusBadge = ({ status }) => {
  const badgeClass = `badge rounded-pill text-white ${getStatusBadgeColor(status)}`;
  return <span className={badgeClass}>{status}</span>;
};


export default StatusBadge;
