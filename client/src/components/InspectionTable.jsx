import React from 'react';
import { Table } from 'react-bootstrap';

const InspectionTable = ({ inspections }) => {
    return (
        <Table striped bordered hover responsive>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Inspection No.</th>
                    <th>Inspected Date</th>
                    <th>Maintenance Date</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {/* Ensure inspections is an array and map is called correctly */}
                {Array.isArray(inspections) && inspections.length > 0 ? (
                    inspections.map((inspection) => (
                        <tr key={inspection.id}>
                            <td>{inspection.id}</td>
                            <td>{inspection.inspectionNo}</td>
                            <td>{inspection.inspectedDate}</td>
                            <td>{inspection.maintenanceDate || 'N/A'}</td>
                            <td>{inspection.status}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="5" className="text-center">No inspections found.</td>
                    </tr>
                )}
            </tbody>
        </Table>
    );
};

export default InspectionTable;