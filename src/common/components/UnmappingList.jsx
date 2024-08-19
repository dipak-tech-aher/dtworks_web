import React from 'react';

const UnmappingList = ({ mappedItems, onUnmap }) => {
  return (
    <div>
      <h2>Mapped List</h2>
      <ul style={{margin: "5px 0"}}>
        {mappedItems.map(item => (
          <li key={item.id}>
            {item.name} <button onClick={() => onUnmap(item)}>Unmap</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UnmappingList;
