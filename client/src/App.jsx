import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import DocumentPage from './components/DocumentPage';

// Root React component sets up routing:
// - "/" creates a new random document id and redirects to it
// - "/documents/:id" loads the collaborative editor for that specific document

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={`/documents/${uuidv4()}`} replace />}
      />
      <Route path="/documents/:id" element={<DocumentPage />} />
    </Routes>
  );
}

export default App;

