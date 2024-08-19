import React from 'react';
import JsonView from 'react18-json-view'
import 'react18-json-view/src/style.css'

const JsonViewer = ({ jsonData }) => {
  return (
    <div style={{ width: '800px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <JsonView
        src={jsonData}
        displaySize={false}
        theme="rjv-default"
        style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}
      />
    </div>
  );
};

export default JsonViewer;
