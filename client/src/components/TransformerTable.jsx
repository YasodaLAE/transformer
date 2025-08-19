import React from 'react';
import { Table, Dropdown, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext'; // Import the useAuth hook

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

const TransformerTable = ({ transformers, onDelete }) => {
    const { isAdmin } = useAuth(); // Access the isAdmin state

    return (
        <table className="table table-striped">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Region</th>
                    <th>Pole ID</th>
                    <th>Type</th>
                    <th></th>
                    {isAdmin && <th></th>}
                </tr>
            </thead>
            <tbody>
                {transformers.map((transformer) => (
                    <tr key={transformer.id}>
                        <td>{transformer.transformerId}</td>
                        <td>{transformer.region}</td>
                        <td>{transformer.poleId}</td>
                        <td>{transformer.transformerType}</td>
                        <td>
                            <Link to={`/inspections/by-transformer/${transformer.id}`} className="btn btn-primary btn-sm">View
                            </Link>
                        </td>

                            {/* This is the key part: conditionally render the dropdown based on isAdmin */}
                            {isAdmin && (
                                <td>
                                  <Dropdown>
                                    <Dropdown.Toggle as={CustomToggle} id="dropdown-custom">
                                      &#x22EE; {/* just the three vertical dots */}
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu>
                                      <Dropdown.Item
                                        onClick={() => onDelete(transformer.id)}
                                        className="text-danger"
                                      >
                                        Delete
                                      </Dropdown.Item>
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

export default TransformerTable;