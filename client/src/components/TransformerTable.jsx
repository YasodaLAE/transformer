import React from 'react';
import { Link } from 'react-router-dom';

const TransformerTable = ({ transformers }) => {
    return (
        <table className="table table-striped">
            <thead>
                <tr>
                    <th>Transformer No.</th>
                    <th>Location</th>
                    <th>Capacity (kVA)</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {transformers.map((transformer) => (
                    <tr key={transformer.id}>
                        <td>{transformer.transformerId}</td>
                        <td>{transformer.location}</td>
                        <td>{transformer.capacity}</td>
                        <td>
                            <Link to={`/transformers/${transformer.id}`} className="btn btn-primary btn-sm">
                                View
                            </Link>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default TransformerTable;