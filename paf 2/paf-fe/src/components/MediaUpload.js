import React, { useState, useRef, useEffect } from 'react';
import { Row, Col, Button, Alert, ProgressBar } from 'react-bootstrap';
import { FaImage, FaVideo, FaYoutube, FaTimes, FaInfoCircle, FaUpload } from 'react-icons/fa';
import { toast } from 'react-toastify';

const MediaUpload = ({ onChange, maxItems = 3, initialItems = [] }) => {
  const [mediaItems, setMediaItems] = useState([]);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const youtubeInputRef = useRef(null);
  
  // Initialize with initial items if provided
  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setMediaItems(initialItems);
    }
  }, [initialItems]);
  
  // Call onChange whenever mediaItems changes
  useEffect(() => {
    onChange(mediaItems);
  }, [mediaItems, onChange]);
  
  // Handle file selection and upload
  const handleFileSelect = async (e) => {
    if (mediaItems.length >= maxItems) {
      setError(`Maximum ${maxItems} media items allowed`);
      return;
    }
    
    const file = e.target.files[0];
    if (!file) return;
    
    console.log("Selected file:", file.name, "type:", file.type, "size:", file.size);
    
    // Check file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('Only image and video files are supported');
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }
    
    // Check video duration if it's a video
    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 30) {
          setError('Videos must be 30 seconds or less');
          return;
        }
        // Upload the video if it's within the duration limit
        uploadFile(file);
      };
      
      video.onerror = () => {
        console.error("Error loading video metadata");
        setError('Error loading video. Please try another file.');
      };
      
      video.src = URL.createObjectURL(file);
    } else {
      // Upload image directly
      uploadFile(file);
    }
    
    // Reset the file input
    e.target.value = null;
  };
  
  // Upload file to server - with better error handling and debugging
  const uploadFile = async (file) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      
      console.log("Starting upload for file:", file.name, "size:", file.size, "type:", file.type);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Get auth token
      const token = localStorage.getItem('accessToken');
      
      // Track upload progress with XMLHttpRequest instead of fetch
      const xhr = new XMLHttpRequest();
      
      // Create a Promise to handle the XHR response
      const uploadPromise = new Promise((resolve, reject) => {
        // Set up progress tracking
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total);
            console.log("Upload progress:", progress);
            setUploadProgress(progress);
          }
        });
        
        // Set up completion handler
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error("Invalid JSON response: " + xhr.responseText));
            }
          } else {
            reject(new Error(`Server responded with ${xhr.status}: ${xhr.responseText}`));
          }
        };
        
        // Set up error handler
        xhr.onerror = () => {
          reject(new Error("Network error occurred during upload"));
        };
        
        // Set up abort handler
        xhr.onabort = () => {
          reject(new Error("Upload aborted"));
        };
      });
      
      // Open and send the request
      xhr.open('POST', '/api/upload', true);
      
      // Set headers
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      // Send the form data
      xhr.send(formData);
      
      // Wait for the upload to complete
      const data = await uploadPromise;
      console.log("Upload successful, received data:", data);
      
      if (!data.url) {
        throw new Error("Server didn't return a valid URL");
      }
      
      // Add uploaded media to the list
      addMediaItem(null, data.url, data.type || file.type, false);
      
      // Show success toast
      toast.success('File uploaded successfully');
      
      setUploading(false);
      setUploadProgress(100);
    } catch (error) {
      console.error('Upload error:', error);
      setError(`Failed to upload file: ${error.message}`);
      toast.error(`Upload failed: ${error.message}`);
      setUploading(false);
    }
  };
  
  // Handle YouTube link
  const handleYoutubeLink = () => {
    if (mediaItems.length >= maxItems) {
      setError(`Maximum ${maxItems} media items allowed`);
      return;
    }
    
    const youtubeUrl = youtubeInputRef.current.value;
    if (!youtubeUrl) return;
    
    // Better YouTube URL validation
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(\&.*)?$/;
    if (!youtubeRegex.test(youtubeUrl)) {
      setError('Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID)');
      return;
    }
    
    // Add YouTube URL as media item
    addMediaItem(null, youtubeUrl, 'youtube', false);
    youtubeInputRef.current.value = '';
    toast.success('YouTube video added');
  };
  
  // Add a media item to the list
  const addMediaItem = (file, url, type, blobCreatedByUs = false) => {
    // Check if the URL already exists to prevent duplicates
    if (mediaItems.some(item => item.url === url)) {
      setError("This media has already been added");
      return;
    }
    
    const newItem = { file, url, type, id: Date.now(), blobCreatedByUs };
    const updatedItems = [...mediaItems, newItem];
    setMediaItems(updatedItems);
    setError(null);
    
    // Call the onChange callback with all media items
    onChange(updatedItems);
  };
  
  // Remove a media item
  const removeMediaItem = (id) => {
    // Find the item to check if it's a blob URL that needs to be revoked
    const itemToRemove = mediaItems.find(item => item.id === id);
    if (itemToRemove && itemToRemove.url && itemToRemove.url.startsWith('blob:') && itemToRemove.blobCreatedByUs) {
      // Revoke the blob URL to prevent memory leaks
      URL.revokeObjectURL(itemToRemove.url);
    }
    
    const updatedItems = mediaItems.filter(item => item.id !== id);
    setMediaItems(updatedItems);
    onChange(updatedItems);
  };
  
  // Helper to get media item preview
  const getMediaPreview = (item) => {
    // Handle YouTube videos
    if (item.type === 'youtube' || item.url.includes('youtube.com') || item.url.includes('youtu.be')) {
      // Extract video ID from YouTube URL
      let videoId = '';
      
      try {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(\&.*)?$/;
        const match = item.url.match(youtubeRegex);
        
        if (match && match[4]) {
          videoId = match[4];
        } else if (item.url.includes('youtube.com/watch?v=')) {
          videoId = item.url.split('v=')[1];
          // Remove any additional parameters
          const ampersandPosition = videoId.indexOf('&');
          if (ampersandPosition !== -1) {
            videoId = videoId.substring(0, ampersandPosition);
          }
        } else if (item.url.includes('youtu.be/')) {
          videoId = item.url.split('youtu.be/')[1];
          // Remove any additional parameters
          const questionMarkPosition = videoId.indexOf('?');
          if (questionMarkPosition !== -1) {
            videoId = videoId.substring(0, questionMarkPosition);
          }
        }
        
        if (videoId) {
          return (
            <div className="ratio ratio-16x9">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded"
              ></iframe>
            </div>
          );
        } else {
          return <div className="alert alert-warning">Invalid YouTube URL</div>;
        }
      } catch (error) {
        console.error("Error parsing YouTube URL:", error);
        return <div className="alert alert-warning">Error parsing YouTube URL</div>;
      }
    } 
    // Handle images
    else if (
      (typeof item.type === 'string' && item.type.startsWith('image/')) || 
      (typeof item.url === 'string' && item.url.match(/\.(jpg|jpeg|png|gif|webp)$/i))
    ) {
      return (
        <div className="image-preview">
          <img 
            src={item.url} 
            className="img-fluid rounded" 
            alt="Preview" 
            onError={(e) => {
              console.error("Error loading image:", item.url);
              e.target.src = 'https://via.placeholder.com/400x300?text=Image+Load+Error';
            }}
          />
        </div>
      );
    } 
    // Handle videos
    else if (
      (typeof item.type === 'string' && item.type.startsWith('video/')) || 
      (typeof item.url === 'string' && item.url.match(/\.(mp4|mov|avi|wmv|webm)$/i))
    ) {
      return (
        <div className="video-preview">
          <video 
            className="w-100 rounded" 
            controls
            onError={(e) => console.error("Error loading video:", item.url)}
          >
            <source src={item.url} type={item.type || 'video/mp4'} />
            Your browser does not support the video tag.
          </video>
          <div className="mt-1 text-center text-muted small">
            If video doesn't play, <a href={item.url} target="_blank" rel="noopener noreferrer">click here</a>
          </div>
        </div>
      );
    }
    
    // Default case for unsupported media
    return (
      <div className="alert alert-warning">
        <FaInfoCircle className="me-2" />
        Unsupported media type: {item.type || 'unknown'}
        <div className="mt-2">
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary">
            View File
          </a>
        </div>
      </div>
    );
  };
  
  return (
    <div className="media-upload mb-4">
      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      
      {/* Media preview */}
      {mediaItems.length > 0 && (
        <Row className="mb-3">
          {mediaItems.map((item) => (
            <Col xs={12} md={4} key={item.id} className="mb-3">
              <div className="position-relative">
                {getMediaPreview(item)}
                <Button
                  variant="danger"
                  size="sm"
                  className="position-absolute top-0 end-0 m-2"
                  onClick={() => removeMediaItem(item.id)}
                >
                  <FaTimes />
                </Button>
              </div>
            </Col>
          ))}
        </Row>
      )}
      
      {/* Upload controls */}
      {mediaItems.length < maxItems && (
        <Row className="g-2">
          <Col>
            <Button
              variant="outline-primary"
              onClick={() => fileInputRef.current.click()}
              className="w-100"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <FaUpload className="me-2" /> Uploading...
                </>
              ) : (
                <>
                  <FaImage className="me-2" /> Add Photo/Video
                </>
              )}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*"
              style={{ display: 'none' }}
            />
          </Col>
          
          <Col>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="YouTube URL"
                ref={youtubeInputRef}
                disabled={uploading}
              />
              <Button 
                variant="outline-secondary" 
                onClick={handleYoutubeLink}
                disabled={uploading}
              >
                <FaYoutube /> Add
              </Button>
            </div>
          </Col>
        </Row>
      )}
      
      {uploading && (
        <ProgressBar animated now={uploadProgress} className="mt-3" label={`${uploadProgress}%`} />
      )}
      
      <div className="mt-2 text-muted small">
        <FaInfoCircle className="me-1" /> 
        Add up to {maxItems} photos or videos. Videos must be 30 seconds or less and files must be under 10MB.
      </div>
    </div>
  );
};

export default MediaUpload;