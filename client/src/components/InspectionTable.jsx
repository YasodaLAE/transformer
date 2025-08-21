import React from 'react';
import { Table, Dropdown } from 'react-bootstrap';
import { useAuth } from '../hooks/AuthContext';
import { Link } from "react-router-dom";

const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
  <button
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className="btn btn-light shadow-sm border"
    style={{ padding: "4px 8px" }}
  >
    {children}
  </button>
));

// The component now receives 'onDelete' and 'onEdit' from the parent page
const InspectionTable = ({ inspections, onDelete, onEdit }) => {
    const { isAdmin } = useAuth();

    return (
        <table className="table table-striped">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Inspection No.</th>
                    <th>Inspected Date</th>
                    <th>Maintenance Date</th>
                    <th>Status</th>
                    <th></th>
                    {isAdmin && <th></th>}
                </tr>
            </thead>
            <tbody>
                {Array.isArray(inspections) && inspections.length > 0 ? (
                    inspections.map((inspection) => (
                        <tr key={inspection.id}>
                            <td>{inspection.id}</td>
                            <td>{inspection.inspectionNo}</td>
                            <td>{inspection.inspectedDate}</td>
                            <td>{inspection.maintenanceDate || 'N/A'}</td>
                            <td>{inspection.status}</td>
                            <td>
                                <Link to={`/inspections/by-transformers/${inspection.id}`} className="btn btn-primary btn-sm">View</Link>
                            </td>
                            {isAdmin && (
                                <td>
                                <Dropdown>
                                    <Dropdown.Toggle as={CustomToggle} id="dropdown-custom">
                                        &#x22EE;
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        {/* Add this Dropdown.Item for the Edit button */}
                                        <Dropdown.Item onClick={() => onEdit(inspection)}>
                                            Edit
                                        </Dropdown.Item>
                                        {/* This now calls the 'onDelete' function passed from the parent page */}
                                        <Dropdown.Item onClick={() => onDelete(inspection.id)} className="text-danger">
                                            Delete
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                                </td>
                            )}
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="5" className="text-center">No inspections found.</td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

export default InspectionTable;