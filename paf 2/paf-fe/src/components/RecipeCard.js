import React, { useState } from 'react';
import { Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { FaHeart, FaRegHeart, FaComment, FaRegBookmark, FaBookmark, FaShare, FaClock, FaUtensils, FaFire } from 'react-icons/fa';
import { formatTimeAgo } from '../utils/helpers'; // Assume this is imported from a utils file

const RecipeCard = ({ 
  post, 
  user, 
  isLiked, 
  isBookmarked, 
  commentsCount = 0,
  likeCount = 0, // Add this prop
  onLike, 
  onBookmark, 
  onComment, 
  onShare 
}) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // Helper to truncate text
  const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };
  
  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Beginner': return 'success';
      case 'Intermediate': return 'warning';
      case 'Advanced': return 'danger';
      default: return 'secondary';
    }
  };
  
  // Add this function to detect and handle YouTube videos
  const renderYouTubeVideo = (url) => {
    // Extract video ID from YouTube URL
    let videoId = '';
    
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1];
      // Remove any additional parameters
      const ampersandPosition = videoId.indexOf('&');
      if (ampersandPosition !== -1) {
        videoId = videoId.substring(0, ampersandPosition);
      }
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1];
      // Remove any additional parameters
      const questionMarkPosition = videoId.indexOf('?');
      if (questionMarkPosition !== -1) {
        videoId = videoId.substring(0, questionMarkPosition);
      }
    }
    
    if (videoId) {
      return (
        <div className="ratio ratio-16x9 mb-3">
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
    }
    
    // If not a valid YouTube URL or couldn't extract ID
    return <a href={url} target="_blank" rel="noopener noreferrer" className="d-block mb-3">View Media</a>;
  };
  
  // Update the renderMedia function
  const renderMedia = () => {
    if (post.mediaLinks && post.mediaLinks.length > 0) {
      return (
        <div className="recipe-media-gallery">
          <Row>
            {post.mediaLinks.map((mediaLink, index) => {
              // Determine appropriate column size based on number of items
              const colSize = post.mediaLinks.length === 1 ? 12 : 
                             (post.mediaLinks.length === 2 ? 6 : 4);
              
              // Check for YouTube link
              if (mediaLink.includes('youtube.com') || mediaLink.includes('youtu.be')) {
                return (
                  <Col xs={12} md={colSize} key={index} className="mb-3">
                    {renderYouTubeVideo(mediaLink)}
                  </Col>
                );
              }
              
              // For images
              else if (mediaLink.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
                  (post.mediaTypes && post.mediaTypes[index] && 
                   post.mediaTypes[index].includes('image'))) {
                return (
                  <Col xs={12} md={colSize} key={index} className="mb-3">
                    <img 
                      src={mediaLink} 
                      alt={`${post.title} - media ${index+1}`} 
                      className="img-fluid rounded recipe-card-media" 
                    />
                  </Col>
                );
              }
              
              // For videos - add poster attribute to show a preview
              else if (mediaLink.match(/\.(mp4|mov|avi|wmv|webm)$/i) || 
                  (post.mediaTypes && post.mediaTypes[index] && 
                   post.mediaTypes[index].includes('video'))) {
                return (
                  <Col xs={12} md={colSize} key={index} className="mb-3">
                    <div className="ratio ratio-16x9 video-preview-container">
                      <video 
                        controls
                        preload="metadata"
                        className="rounded w-100"
                        playsInline
                        poster={post.thumbnailUrl || ""}
                        onLoadedMetadata={(e) => {
                          // Try to generate a poster from the video if not already set
                          if (!e.target.poster) {
                            try {
                              // Create a canvas to capture the first frame
                              const canvas = document.createElement('canvas');
                              canvas.width = e.target.videoWidth;
                              canvas.height = e.target.videoHeight;
                              const ctx = canvas.getContext('2d');
                              
                              // Draw the first frame to the canvas
                              ctx.drawImage(e.target, 0, 0, canvas.width, canvas.height);
                              
                              // Set the canvas image as poster
                              e.target.poster = canvas.toDataURL('image/jpeg');
                            } catch (err) {
                              console.error("Failed to generate video thumbnail:", err);
                            }
                          }
                        }}
                      >
                        <source src={mediaLink} type={post.mediaTypes ? post.mediaTypes[index] : 'video/mp4'} />
                        Your browser does not support the video tag.
                      </video>
                      
                      {/* Play button overlay for better UX */}
                      <div className="video-play-overlay">
                        <div className="play-button">▶</div>
                      </div>
                    </div>
                  </Col>
                );
              }
              
              // For unknown media types
              return (
                <Col xs={12} md={colSize} key={index} className="mb-3">
                  <a href={mediaLink} target="_blank" rel="noopener noreferrer" className="d-block p-3 bg-light text-center rounded">
                    View Media
                  </a>
                </Col>
              );
            })}
          </Row>
        </div>
      );
    }
    
    // Fallback to legacy format
    else if (post.mediaLink) {
      // Check for YouTube link in legacy format
      if (post.mediaLink.includes('youtube.com') || post.mediaLink.includes('youtu.be')) {
        return renderYouTubeVideo(post.mediaLink);
      }
      
      // For images
      if (post.mediaType?.includes('image') || post.mediaLink.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return (
          <img 
            src={post.mediaLink} 
            alt={post.title} 
            className="img-fluid rounded mb-3 recipe-card-media" 
          />
        );
      }
      
      // For videos - also add the poster and overlay to legacy format
      if (post.mediaType?.includes('video') || post.mediaLink.match(/\.(mp4|mov|avi|wmv|webm)$/i)) {
        return (
          <div className="ratio ratio-16x9 mb-3 video-preview-container">
            <video 
              controls
              preload="metadata"
              className="rounded w-100"
              playsInline
              poster={post.thumbnailUrl || ""}
              onLoadedMetadata={(e) => {
                // Try to generate a poster from the video if not already set
                if (!e.target.poster) {
                  try {
                    // Create a canvas to capture the first frame
                    const canvas = document.createElement('canvas');
                    canvas.width = e.target.videoWidth;
                    canvas.height = e.target.videoHeight;
                    const ctx = canvas.getContext('2d');
                    
                    // Draw the first frame to the canvas
                    ctx.drawImage(e.target, 0, 0, canvas.width, canvas.height);
                    
                    // Set the canvas image as poster
                    e.target.poster = canvas.toDataURL('image/jpeg');
                  } catch (err) {
                    console.error("Failed to generate video thumbnail:", err);
                  }
                }
              }}
            >
              <source src={post.mediaLink} type={post.mediaType || 'video/mp4'} />
              Your browser does not support the video tag.
            </video>
            
            {/* Play button overlay for better UX */}
            <div className="video-play-overlay">
              <div className="play-button">▶</div>
            </div>
          </div>
        );
      }
    }
    
    return null;
  };
  
  return (
    <Card className="recipe-card">
      {/* Recipe Header */}
      <div className="recipe-card-header">
        <div className="recipe-author">
          <div className="recipe-author-avatar">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.username} />
            ) : (
              <div className="avatar-placeholder">{user?.username?.charAt(0) || 'U'}</div>
            )}
          </div>
          <div className="recipe-author-info">
            <h6 className="recipe-author-name">{user?.username || 'Unknown Chef'}</h6>
            <p className="recipe-time">{formatTimeAgo(post.timestamp)}</p>
          </div>
        </div>
      </div>
      
      {/* Recipe Title and Media */}
      <div className="recipe-card-content">
        <h3 className="recipe-title">{post.title}</h3>
        
        {/* Recipe Media */}
        {renderMedia()}
        
        {/* Recipe Badges */}
        <div className="recipe-badges">
          {post.cuisineType && (
            <Badge pill bg="info" className="recipe-badge">
              {post.cuisineType}
            </Badge>
          )}
          
          {post.difficultyLevel && (
            <Badge pill bg={getDifficultyColor(post.difficultyLevel)} className="recipe-badge">
              <FaFire className="badge-icon" /> {post.difficultyLevel}
            </Badge>
          )}
          
          {post.cookingTime && (
            <Badge pill bg="secondary" className="recipe-badge">
              <FaClock className="badge-icon" /> {post.cookingTime}
            </Badge>
          )}
        </div>
        
        {/* Recipe Description */}
        <div className="recipe-description">
          {showFullDescription ? (
            <p>{post.contentDescription}</p>
          ) : (
            <p>{truncateText(post.contentDescription, 150)}</p>
          )}
          
          {post.contentDescription && post.contentDescription.length > 150 && (
            <Button 
              variant="link" 
              className="show-more-btn p-0"
              onClick={() => setShowFullDescription(!showFullDescription)}
            >
              {showFullDescription ? 'Show less' : 'Show more'}
            </Button>
          )}
        </div>
        
        {/* Recipe Ingredients Preview */}
        {post.ingredients && post.ingredients.length > 0 && (
          <div className="recipe-ingredients-preview">
            <h6><FaUtensils className="me-2" /> Ingredients</h6>
            <Row>
              {post.ingredients.slice(0, 4).map((ingredient, index) => (
                <Col xs={6} key={index} className="ingredient-item">
                  <span className="ingredient-bullet">•</span> {ingredient}
                </Col>
              ))}
              {post.ingredients.length > 4 && (
                <Col xs={12}>
                  <Button 
                    variant="link" 
                    className="show-more-ingredients p-0"
                    onClick={() => onComment(post.id)}
                  >
                    View all {post.ingredients.length} ingredients
                  </Button>
                </Col>
              )}
            </Row>
          </div>
        )}
      </div>
      
      {/* Recipe Actions */}
      <div className="recipe-card-actions">
        <Button 
          variant="link" 
          className={`recipe-action-btn ${isLiked ? 'liked' : ''}`}
          onClick={() => onLike(post.id)}
        >
          {isLiked ? <FaHeart /> : <FaRegHeart />}
          <span className="action-count">
            {likeCount > 0 ? likeCount : ''} Like{likeCount !== 1 ? 's' : ''}
          </span>
        </Button>
        
        <Button 
          variant="link" 
          className="recipe-action-btn"
          onClick={() => onComment(post.id)}
        >
          <FaComment />
          <span className="action-count">{commentsCount > 0 ? commentsCount : ''} Comment{commentsCount !== 1 ? 's' : ''}</span>
        </Button>
        
        <Button 
          variant="link" 
          className={`recipe-action-btn ${isBookmarked ? 'bookmarked' : ''}`}
          onClick={() => onBookmark(post.id)}
        >
          {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
          <span className="action-count">Save</span>
        </Button>
        
        <Button 
          variant="link" 
          className="recipe-action-btn"
          onClick={() => onShare(post.id)}
        >
          <FaShare />
          <span className="action-count">Share</span>
        </Button>
      </div>
      
      {/* Recipe Card Styles */}
      <style jsx>{`
        .recipe-card {
          border: none;
          border-radius: 15px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
          overflow: hidden;
          transition: all 0.3s ease;
          background-color: white;
        }
        
        .recipe-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        
        .recipe-card-header {
          padding: 15px 20px;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .recipe-author {
          display: flex;
          align-items: center;
        }
        
        .recipe-author-avatar {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          margin-right: 12px;
          overflow: hidden;
          border: 2px solid var(--primary-color);
        }
        
        .recipe-author-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background-color: var(--primary-color);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.2rem;
        }
        
        .recipe-author-name {
          margin: 0;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .recipe-time {
          margin: 0;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        
        .recipe-card-content {
          padding: 20px;
        }
        
        .recipe-title {
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          color: var(--primary-dark);
          margin-bottom: 15px;
          font-size: 1.5rem;
        }
        
        .recipe-media-gallery {
          margin-bottom: 15px;
        }
        
        .recipe-card-media {
          width: 100%;
          height: 250px;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        
        .recipe-card-media:hover {
          transform: scale(1.05);
        }
        
        /* Video preview styling */
        .video-preview-container {
          position: relative;
          overflow: hidden;
          border-radius: 10px;
        }
        
        .video-play-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none; /* Allow clicks to pass through to the video */
        }
        
        .video-preview-container:hover .video-play-overlay {
          opacity: 1;
        }
        
        .play-button {
          width: 60px;
          height: 60px;
          background-color: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: var(--primary-color);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        .recipe-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 15px;
        }
        
        .recipe-badge {
          font-size: 0.8rem;
          padding: 5px 12px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .badge-icon {
          font-size: 0.7rem;
        }
        
        .recipe-description {
          margin-bottom: 15px;
          color: var(--text-primary);
          line-height: 1.6;
        }
        
        .show-more-btn {
          color: var(--primary-color);
          font-weight: 600;
          text-decoration: none;
        }
        
        .show-more-btn:hover {
          text-decoration: underline;
        }
        
        .recipe-ingredients-preview {
          background-color: var(--neutral-light);
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 15px;
        }
        
        .recipe-ingredients-preview h6 {
          color: var(--primary-dark);
          font-weight: 600;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
        }
        
        .ingredient-item {
          margin-bottom: 8px;
          font-size: 0.9rem;
          color: var(--text-primary);
          display: flex;
          align-items: flex-start;
        }
        
        .ingredient-bullet {
          color: var(--primary-color);
          margin-right: 5px;
          font-weight: bold;
        }
        
        .show-more-ingredients {
          color: var(--primary-color);
          font-weight: 600;
          text-decoration: none;
          font-size: 0.9rem;
        }
        
        .show-more-ingredients:hover {
          text-decoration: underline;
        }
        
        .recipe-card-actions {
          display: flex;
          justify-content: space-between;
          padding: 15px 20px;
          border-top: 1px solid #f0f0f0;
        }
        
        .recipe-action-btn {
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 0;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        
        .recipe-action-btn:hover {
          color: var(--primary-color);
        }
        
        .action-count {
          font-size: 0.9rem;
          font-weight: 500;
        }
        
        .recipe-action-btn.liked {
          color: var(--accent-color);
        }
        
        .recipe-action-btn.bookmarked {
          color: var(--primary-color);
        }
      `}</style>
    </Card>
  );
};

export default RecipeCard;