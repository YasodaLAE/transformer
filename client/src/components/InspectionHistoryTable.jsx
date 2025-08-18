import React from 'react';

const InspectionHistoryTable = () => {
    return (
        <div className="mt-4">
            <h5>Inspection History</h5>
            <table className="table">
                <thead>
                    <tr>
                        <th>Transformer No</th>
                        <th>Inspection No</th>
                        <th>Inspected Date</th>
                        <th>Maintenance Date</th>
                        <th>Status</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colSpan="3">No inspection data available for Phase 1.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default InspectionHistoryTable;