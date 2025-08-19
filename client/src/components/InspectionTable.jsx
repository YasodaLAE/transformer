import React from 'react';
import { Table } from 'react-bootstrap';
import Dropdown from 'react-bootstrap/Dropdown';
import { useAuth } from '../hooks/AuthContext';
import {deleteInspection} from '../services/apiService'
import { Link } from "react-router-dom";
import { Button } from 'react-bootstrap';

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

const InspectionTable = ({ inspections, onInspectionDeleted }) => {
    const { isAdmin } = useAuth();
    const handleDelete = async (inspectionId) => {
            // Confirmation dialog for the user
            if (window.confirm('Are you sure you want to delete this inspection?')) {
                try {
                    await deleteInspection(inspectionId);
                    onInspectionDeleted(); // This function will trigger a data refresh
                } catch (error) {
                    console.error('Failed to delete inspection:', error);
                }
    }
     };
    return (
        <table className="table table-striped">
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
                {Array.isArray(inspections) && inspections.length > 0 ? (
                    inspections.map((inspection) => (
                        <tr key={inspection.id}>
                            <td>{inspection.id}</td>
                            <td>{inspection.inspectionNo}</td>
                            <td>{inspection.inspectedDate}</td>
                            <td>{inspection.maintenanceDate || 'N/A'}</td>
                            <td>{inspection.status}</td>
                            <td>
                                <Link to={`/inspections/by-transformers/${inspection.id}`}className="btn btn-primary btn-sm">View
                                </Link>
                            </td>
                                {isAdmin && (
                                    <td>
                                    <Dropdown >
                                        <Dropdown.Toggle as={CustomToggle} id="dropdown-custom">
                                            &#x22EE;
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            <Dropdown.Item onClick={() => handleDelete(inspection.id)}>
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