import React from 'react';
import { Table, Dropdown, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';

const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
  <button
    ref={ref}
    onClick={(e) => { e.preventDefault(); onClick(e); }}
    className="btn btn-light shadow-sm border"
    style={{ padding: "4px 8px" }}
  >
    {children}
  </button>
));

const TransformerTable = ({ transformers, onDelete, onEdit }) => {
    const { isAdmin } = useAuth();

    return (
        <table className="table table-striped">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Region</th>
                    <th>Pole ID</th>
                    <th>Type</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {transformers.map((transformer) => (
                    <tr key={transformer.id}>
                        <td>{transformer.transformerId}</td>
                        <td>{transformer.region}</td>
                        <td>{transformer.poleId}</td>
                        <td>{transformer.transformerType}</td>
                        <td className="d-flex justify-content-end">
                            <Link to={`/inspections/by-transformer/${transformer.id}`} className="btn btn-primary btn-sm me-2">
                                View
                            </Link>
                            {isAdmin && (
                                <Dropdown>
                                    <Dropdown.Toggle as={CustomToggle} id="dropdown-custom">
                                        &#x22EE;
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu align="end">
                                        <Dropdown.Item onClick={() => onEdit(transformer)}>
                                            Edit
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => onDelete(transformer.id)} className="text-danger">
                                            Delete
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default TransformerTable;