import React from 'react';

const MappingList = ({ items, onMap }) => {
  return (
    <div>
      <h2>Unmapped List</h2>
      <ul style={{listStyleType: "none",  padding: "0"}}>
        {items.map(item => (
          <li key={item.id}>
            {item.name} <button onClick={() => onMap(item)}>Map</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MappingList;
