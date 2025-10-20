import React from 'react';
import { Table, Dropdown } from 'react-bootstrap';
import { useAuth } from '../hooks/AuthContext';
import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge"

/**
 * Custom component to render the vertical ellipsis button (⋮) for the Dropdown menu.
 * Prevents default link behavior to keep the dropdown open.
 */
const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
  <button
    ref={ref}
    onClick={(e) => {
      e.preventDefault(); // Stop default button action
      onClick(e);
    }}
    className="btn btn-light shadow-sm border"
    style={{ padding: "4px 8px" }}
  >
    {children}
  </button>
));


/**
 * Renders a table list of inspections, supporting standard and transformer-specific views.
 * * @param {Array} inspections - List of inspection objects.
 * @param {function} onDelete - Handler function for deleting an inspection.
 * @param {function} onEdit - Handler function for editing an inspection.
 * @param {boolean} showTransformerColumn - Flag to show/hide the Transformer column.
 */
const InspectionTable = ({ inspections, onDelete, onEdit, showTransformerColumn = true }) => {
    const { isAdmin } = useAuth(); // Check user role for edit/delete permissions

    /**
     * Formats the ISO date-time string (e.g., "YYYY-MM-DDT...") for display.
     * Removes the time zone and seconds for clean presentation.
     */
    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        const formatted = dateTimeString.split('T').join(' ');
        // Slices off the seconds (.000Z or :00) for cleaner display
        return formatted.slice(0, -3);
    };

    return (
       <table className="table table-striped">
                   <thead>
                       <tr>
                           {showTransformerColumn && <th>Transformer No.</th>}
                           <th>Inspection No.</th>
                           <th>Inspected Date & Time</th>
                           <th>Maintenance Date & Time</th>
                           <th>Status</th>
                           <th></th>
                           {isAdmin && <th></th>} 
                       </tr>
                   </thead>
                   <tbody>
                       {/* Check if inspections array is valid and has data */}
                       {Array.isArray(inspections) && inspections.length > 0 ? (
                           inspections.map((inspection) => (
                               <tr key={inspection.id}>
                                   {/* Conditionally render Transformer ID (used when viewing all inspections) */}
                                   {showTransformerColumn && <td>{inspection.transformer?.transformerId}</td>}
                                   <td>{inspection.inspectionNo}</td>
                                   <td>{formatDateTime(inspection.inspectedDate)}</td>
                                   <td>{inspection.maintenanceDate ? formatDateTime(inspection.maintenanceDate) : 'N/A'}</td>
                                   <td><StatusBadge status = {inspection.status}/></td>
                                   <td>
                                       {/* Link to the Inspection Detail Page */}
                                       <Link to={`/inspections/by-inspection/${inspection.id}`} className="btn btn-primary btn-sm">View</Link>
                                   </td>
                                   {/* Admin Actions Dropdown */}
                                   {isAdmin && (
                                       <td>
                                       <Dropdown>
                                           <Dropdown.Toggle as={CustomToggle} id="dropdown-custom">
                                               &#x22EE; {/* Vertical Ellipsis Icon */}
                                           </Dropdown.Toggle>
                                           <Dropdown.Menu>
                                               {/* Passes the entire inspection object for the modal to load */}
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
                               {/* Message displayed when no data is found */}
                               <td colSpan={showTransformerColumn ? "7" : "6"} className="text-center">No inspections found.</td>
                           </tr>
                       )}
                   </tbody>
               </table>
           );
       };
       export default InspectionTable;