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

    // This helper function formats the date and time string
    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        // Splits the string at 'T' and joins with a space
        const formatted = dateTimeString.split('T').join(' ');
        // Removes the seconds part by slicing the last 3 characters
        return formatted.slice(0, -3);
    };

    return (
       <table className="table table-striped">
                   <thead>
                       <tr>
{/*                            <th>Transformer No.</th> */}
                           <th>Inspection No.</th>
                           {/* Update headers to reflect date and time */}
                           <th>Inspected Date & Time</th>
                           <th>Maintenance Date & Time</th>
                           <th>Status</th>
                           <th></th>
                           {isAdmin && <th></th>}
                       </tr>
                   </thead>
                   <tbody>
                       {Array.isArray(inspections) && inspections.length > 0 ? (
                           inspections.map((inspection) => (
                               <tr key={inspection.id}>
{/*                                    <td>{inspection.transformer ? inspection.transformer.transformerId : 'N/A'}</td> */}
                                   <td>{inspection.inspectionNo}</td>
                                   {/* Display the full date-time string */}
                                   <td>{formatDateTime(inspection.inspectedDate)}</td>
                                   <td>{inspection.maintenanceDate ? formatDateTime(inspection.maintenanceDate) : 'N/A'}</td>
                                   <td>{inspection.status}</td>
                                   <td>
                                       <Link to={`/inspections/by-inspection/${inspection.id}`} className="btn btn-primary btn-sm">View</Link>
                                   </td>
                                   {isAdmin && (
                                       <td>
                                       <Dropdown>
                                           <Dropdown.Toggle as={CustomToggle} id="dropdown-custom">
                                               &#x22EE;
                                           </Dropdown.Toggle>
                                           <Dropdown.Menu>
                                               <Dropdown.Item onClick={() => onEdit(inspection)}>
                                                   Edit
                                               </Dropdown.Item>
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