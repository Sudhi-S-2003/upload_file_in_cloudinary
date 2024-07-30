// src/FileUpload.js
import React, { useState } from 'react';
import axios from 'axios';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState({});

  const onFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { url } = res.data;
      setUploadedFile({ url });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1>Upload a File</h1>
      <form onSubmit={onSubmit}>
        <div>
          <input type="file" onChange={onFileChange} />
        </div>
        <input type="submit" value="Upload" />
      </form>
      {uploadedFile.url && (
        <div>
          <h3>Uploaded File:</h3>
          <img src={uploadedFile.url} alt="uploaded file" />
        </div>
      )}
    </div>
  );
};

export default FileUpload;
