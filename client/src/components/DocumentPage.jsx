import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// URL of the backend API / Socket.io server
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

// Quill toolbar configuration for a "document-style" editor
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'code-block'],
  [{ align: [] }],
  ['link'],
  ['clean'],
];

// Time (ms) between automatic saves when there are changes.
// Requirement: persist the document roughly every 2 seconds if the user is editing.
const SAVE_DEBOUNCE_MS = 2000;

function DocumentPage() {
  const { id: documentId } = useParams();

  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('All changes saved'); // or "Saving..."
  const [isLoading, setIsLoading] = useState(true);

  const socketRef = useRef(null);
  const quillRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);

  // Initial data load + Socket.io setup
  useEffect(() => {
    if (!documentId) return;

    // Fetch the latest content from the REST API
    async function fetchDocument() {
      try {
        const response = await axios.get(`${SERVER_URL}/api/documents/${documentId}`);
        setContent(response.data.content || '');
      } catch (err) {
        console.error('Error fetching document:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocument();

    // 1) Open a Socket.io connection to the backend.
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    // 2) Tell the server which "document room" this client cares about.
    //    Under the hood this is a Socket.io `emit` call from client -> server.
    //    The server listens with `socket.on('join-document')` and then calls `socket.join(documentId)`
    //    so all clients editing the same document share one room.
    socket.emit('join-document', documentId);

    // 3) When the server sends us the latest version of the document
    //    (this runs `socket.emit('load-document', ...)` on the server side),
    //    update local state but mark it as a "remote" update so we don't re-broadcast it.
    socket.on('load-document', (serverContent) => {
      isRemoteUpdateRef.current = true;
      setContent(serverContent || '');
    });

    // 4) When another user sends changes, Socket.io broadcasts a `receive-changes` event
    //    to everyone else in the same room. We listen here and update the editor content.
    socket.on('receive-changes', (serverContent) => {
      isRemoteUpdateRef.current = true;
      setContent(serverContent || '');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [documentId]);

  // Whenever `content` changes, broadcast to other clients (if the change is local)
  useEffect(() => {
    if (!socketRef.current || !documentId) return;

    // If this change came from the server (`load-document` / `receive-changes`),
    // don't broadcast it again or we would create an infinite loop of updates.
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    // Broadcast this user's latest content to other clients in the same document room.
    // - Client side: socket.emit('send-changes', { documentId, content })
    // - Server side: `socket.on('send-changes', ...)` then `socket.to(documentId).emit('receive-changes', ...)`
    socketRef.current.emit('send-changes', {
      documentId,
      content,
    });

    // Schedule an autosave
    scheduleSave(content);
  }, [content, documentId]);

  // Debounced autosave function
  const scheduleSave = (nextContent) => {
    if (!documentId) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('Saving...');

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await axios.put(`${SERVER_URL}/api/documents/${documentId}`, {
          content: nextContent,
        });
        setSaveStatus('All changes saved');
      } catch (err) {
        console.error('Error saving document:', err);
        setSaveStatus('Error while saving');
      }
    }, SAVE_DEBOUNCE_MS);
  };

  // Handle text changes in the editor
  const handleEditorChange = (value, delta, source) => {
    // Only treat "user" changes as edits we should save/broadcast
    if (source === 'user') {
      setContent(value);
    }
  };

  const saveStatusClasses =
    saveStatus === 'Saving...'
      ? 'border-amber-300/80 bg-amber-500/15 text-amber-700'
      : saveStatus === 'Error while saving'
      ? 'border-rose-300/80 bg-rose-500/15 text-rose-700'
      : 'border-emerald-300/80 bg-emerald-500/15 text-emerald-700';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-100 to-indigo-50">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-800 md:text-xl">
              Real-Time Collaborative Document Editor
            </h1>
          </div>
          <div
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${saveStatusClasses}`}
          >
            {saveStatus}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl p-6 md:p-8">
        <div className="mb-4 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Document ID</p>
          <p className="mt-1 break-all font-mono text-sm text-slate-700">{documentId}</p>
        </div>

        {isLoading ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm">
            Loading document...
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/30">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={handleEditorChange}
              modules={{ toolbar: TOOLBAR_OPTIONS }}
              placeholder="Start typing here..."
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default DocumentPage;

