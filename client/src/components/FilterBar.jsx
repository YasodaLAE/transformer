import React from 'react';

const FilterBar = () => {
    return (
        <div className="d-flex justify-content-between align-items-center my-3 p-3 bg-light border rounded">
            <input type="text" className="form-control" placeholder="Search by Transformer No." style={{ maxWidth: '300px' }} />
            <button className="btn btn-secondary">Reset Filters</button>
        </div>
    );
};

export default FilterBar;