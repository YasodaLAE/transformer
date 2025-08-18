import React from 'react';
import { Dropdown } from 'react-bootstrap';

const InspectionTable = ({ inspections, onDelete, onEdit }) => {
    // Check if the onDelete or onEdit functions exist to determine if we should show the Actions column
    const showActions = !!onDelete || !!onEdit;

    return (
        <table className="table table-striped">
            <thead>
                <tr>
                    <th>Inspection No.</th>
                    <th>Inspected Date</th>
                    <th>Maintenance Date</th>
                    <th>Status</th>
                    {showActions && <th>Actions</th>}
                </tr>
            </thead>
            <tbody>
                {inspections.map((inspection) => (
                    <tr key={inspection.id}>
                        <td>{inspection.inspectionNo}</td>
                        <td>{inspection.inspectedDate}</td>
                        <td>{inspection.maintenanceDate || '-'}</td>
                        <td>{inspection.status}</td>
                        {showActions && (
                            <td>
                                <Dropdown>
                                    <Dropdown.Toggle as="span" bsPrefix="" id="dropdown-basic">
                                        <span>⋮</span>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        <Dropdown.Item>View</Dropdown.Item>
                                        {onEdit && <Dropdown.Item onClick={() => onEdit(inspection.id)}>Edit</Dropdown.Item>}
                                        {onDelete && <Dropdown.Item onClick={() => onDelete(inspection.id)} className="text-danger">Delete</Dropdown.Item>}
                                    </Dropdown.Menu>
                                </Dropdown>
                            </td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default InspectionTable;