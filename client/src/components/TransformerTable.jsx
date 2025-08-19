import React from 'react';
import { Link } from 'react-router-dom';
import Dropdown from 'react-bootstrap/Dropdown';

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
    const showActions = !!onDelete; // Check if the onDelete prop exists
    return (
        <table className="table table-striped">
            <thead>
                <tr>
                    <th>Transformer No.</th>
                    <th>Pole No.</th>
                    <th>Region</th>
                    <th>Type</th>
                    <th></th>
                    {showActions && <th></th>}
                </tr>
            </thead>
            <tbody>
                {transformers.map((transformer) => (
                    <tr key={transformer.id}>
                        <td>{transformer.transformerId}</td>
                        <td>{transformer.poleId}</td>
                        <td>{transformer.region}</td>
                        <td>{transformer.transformerType}</td>
                        <td>
                        <Link to={`/inspections/by-transformer/${transformer.id}`} className="btn btn-primary btn-sm">View
                        </Link>
                        </td>
                        {showActions && (
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