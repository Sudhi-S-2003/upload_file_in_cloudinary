// src/FileList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FileList = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileToUpdate, setFileToUpdate] = useState(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await axios.get('http://localhost:5000/files');
        setFiles(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchFiles();
  }, []);

  const handleDelete = async (public_id) => {
    try {
      const response = await axios.delete('http://localhost:5000/delete', {
        params: { public_id }
      });
      console.log("Delete response:", response.data);
      setFiles(files.filter(file => file.public_id !== public_id));
    } catch (err) {
      console.error("Error deleting file:", err.response ? err.response.data : err.message);
    }
  };

  const handleUpdate = async () => {
    if (!fileToUpdate) {
      console.error("No file selected for update");
      return;
    }

    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Send the PUT request to update the file
      const response = await axios.put(`http://localhost:5000/update/${encodeURIComponent(fileToUpdate)}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log("Update response:", response.data);
      // Update the file state
      setFiles(files.map(file => (file.public_id === fileToUpdate ? response.data : file)));
      setSelectedFile(null);
      setFileToUpdate(null);
    } catch (err) {
      console.error("Error updating file:", err.response ? err.response.data : err.message);
    }
  };

  return (
    <div>
      <h2>Uploaded Files</h2>
      <div>
        {files.map(file => (
          <div key={file.public_id}>
            <img src={file.url} alt="uploaded file" width="100" />
            <div>
              <button onClick={() => handleDelete(file.public_id)}>Delete</button>
              <input
                type="file"
                onChange={(e) => {
                  setSelectedFile(e.target.files[0]);
                  setFileToUpdate(file.public_id);
                }}
              />
              <button onClick={handleUpdate}>Update</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;
