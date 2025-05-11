import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Badge, Modal, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { postService, commentService, likeService, userService, bookmarkService, notificationService } from '../api/apiService';
import { FaHeart, FaRegHeart, FaComment, FaUserCircle, FaBookmark, FaRegBookmark, FaEdit, FaTrash, FaEllipsisV, FaPlus, FaShare } from 'react-icons/fa';
// Import the MediaUpload component
import MediaUpload from '../components/MediaUpload';
// Import the RecipeCard component
import RecipeCard from '../components/RecipeCard';
// Import toast for notifications
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Replace date-fns with a simple function
const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
};

const Feed = () => {
  const { currentUser } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPost, setNewPost] = useState({ contentDescription: '', title: '' });
  // Add state for media items
  const [mediaItems, setMediaItems] = useState([]);
  const [comments, setComments] = useState({});
  const [likes, setLikes] = useState({});
  const [users, setUsers] = useState({});
  const [newComment, setNewComment] = useState({});
  const [submittingPost, setSubmittingPost] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingComment, setEditingComment] = useState({ id: null, text: '' });
  // Add state to track bookmarked posts
  const [bookmarkedPosts, setBookmarkedPosts] = useState({});

  // Add state for post editing
  const [editingPost, setEditingPost] = useState(null);
  const [editPostForm, setEditPostForm] = useState({});
  const [editMediaItems, setEditMediaItems] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  // Add navigate for routing
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  // Debug logging for media URLs
  useEffect(() => {
    // Log all media URLs for debugging
    posts.forEach(post => {
      if (post.mediaLinks && post.mediaLinks.length > 0) {
        console.log("Post media links:", post.mediaLinks);
        console.log("Post media types:", post.mediaTypes);
      } else if (post.mediaLink) {
        console.log("Post legacy media link:", post.mediaLink);
        console.log("Post legacy media type:", post.mediaType);
      }
    });
  }, [posts]);

  // Add useEffect to load user's bookmarks when component mounts
  useEffect(() => {
    const fetchUserBookmarks = async () => {
      try {
        const response = await bookmarkService.getUserBookmarks(currentUser.id);
        // Create a map of bookmarked post IDs for easy lookup
        const bookmarkMap = {};
        response.data.forEach(bookmark => {
          bookmarkMap[bookmark.resourceId] = bookmark;
        });
        setBookmarkedPosts(bookmarkMap);
      } catch (err) {
        console.error("Error fetching user bookmarks:", err);
      }
    };

    if (currentUser?.id) {
      fetchUserBookmarks();
    }
  }, [currentUser]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postService.getAllPosts();
      const fetchedPosts = response.data;
      // Sort posts by timestamp (newest first)
      fetchedPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setPosts(fetchedPosts);
      // Fetch comments, likes, and user data for each post
      await Promise.all([
        fetchCommentsForPosts(fetchedPosts),
        fetchLikesForPosts(fetchedPosts),
      ]);
      // Fetch user data for posts
      const userIds = [...new Set(fetchedPosts.map(post => post.userId))];
      await fetchUsers(userIds);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentsForPosts = async (posts) => {
    const commentsObject = { ...comments };
    const userIdsToFetch = new Set(); // Use a Set to collect unique user IDs
    
    for (const post of posts) {
      try {
        const response = await commentService.getCommentsByPostId(post.id);
        commentsObject[post.id] = response.data;
        
        // Collect user IDs from comments
        response.data.forEach(comment => {
          userIdsToFetch.add(comment.userId);
        });
      } catch (err) {
        console.error(`Error fetching comments for post ${post.id}:`, err);
        commentsObject[post.id] = [];
      }
    }
    
    setComments(commentsObject);
    
    // Fetch user data for all commenters
    if (userIdsToFetch.size > 0) {
      await fetchUsers([...userIdsToFetch]);
    }
  };

  const fetchLikesForPosts = async (posts) => {
    const likesObject = { ...likes };
    for (const post of posts) {
      try {
        const response = await likeService.getLikesByPostId(post.id);
        likesObject[post.id] = response.data;
      } catch (err) {
        console.error(`Error fetching likes for post ${post.id}:`, err);
        likesObject[post.id] = [];
      }
    }
    setLikes(likesObject);
  };

  const fetchUsers = async (userIds) => {
    // Make sure we're working with unique IDs
    const uniqueIds = [...new Set(userIds)];
    const usersObject = { ...users };
    
    for (const userId of uniqueIds) {
      // Skip if we already have complete info for this user
      if (usersObject[userId]?.email) continue;
      
      try {
        const response = await userService.getUserById(userId);
        
        if (response.data) {
          usersObject[userId] = {
            ...response.data,
            // Make sure username is set for display - prefer email without domain
            username: response.data.email ? response.data.email.split('@')[0] : 
                     (response.data.username || `User ${userId.substring(0, 6)}`)
          };
          
          console.log("Fetched user data for ID:", userId, usersObject[userId]);
        } else {
          console.warn(`No user data returned for ID ${userId}`);
          usersObject[userId] = { 
            username: `User ${userId.substring(0, 6)}`, 
            email: `User${userId.substring(0, 6)}`,
            id: userId 
          };
        }
      } catch (err) {
        console.error(`Error fetching user ${userId}:`, err);
        usersObject[userId] = { 
          username: `User ${userId.substring(0, 6)}`, 
          email: `User${userId.substring(0, 6)}`, 
          id: userId 
        };
      }
    }
    
    setUsers(usersObject);
  };

  // Add this function to your Feed.js component
  const fetchUserProfile = async (userId) => {
    if (!userId) return;
    
    // Skip if we already have complete user data
    if (users[userId]?.email) return;
    
    try {
      console.log(`Fetching profile for user ${userId}`);
      const response = await userService.getUserById(userId);
      
      if (response.data) {
        // Update users state with the full profile
        setUsers(prev => ({
          ...prev,
          [userId]: {
            ...response.data,
            // Extract username from email for display
            username: response.data.email ? response.data.email.split('@')[0] : 
                    (response.data.username || `User ${userId.substring(0, 6)}`)
          }
        }));
        console.log(`Updated user data for ${userId}:`, response.data);
      } else {
        console.warn(`No data returned for user ${userId}`);
      }
    } catch (err) {
      console.error(`Error fetching user profile for ${userId}:`, err);
    }
  };

  const handleNewPostChange = (e) => {
    const { name, value } = e.target;
    setNewPost(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewPostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.title || !newPost.contentDescription) return;
    
    try {
      setSubmittingPost(true);
      
      // Create arrays from media items
      const mediaLinks = mediaItems.map(item => item.url);
      const mediaTypes = mediaItems.map(item => item.type);
      
      console.log("Submitting with media:", { mediaLinks, mediaTypes });
      
      const postData = {
        ...newPost,
        userId: currentUser.id,
        timestamp: new Date(),
        // Add both formats to ensure compatibility
        mediaLinks: mediaLinks,
        mediaTypes: mediaTypes,
        // Legacy format - only use first item if available
        mediaLink: mediaLinks.length > 0 ? mediaLinks[0] : '',
        mediaType: mediaTypes.length > 0 ? mediaTypes[0] : ''
      };
      
      const response = await postService.createPost(postData);
      const createdPost = response.data;
      
      // Update posts list with the new post
      setPosts(prev => [createdPost, ...prev]);
      
      // Clear the form
      setNewPost({ 
        title: '', 
        contentDescription: '', 
        ingredients: [], 
        instructions: '',
        cookingTime: '',
        difficultyLevel: '',
        cuisineType: ''
      });
      setMediaItems([]);
      
      toast.success('Recipe shared successfully!');
    } catch (err) {
      console.error('Error creating post:', err);
      console.error('Error details:', err.response?.data || err.message);
      toast.error('Failed to create post. Please try again.');
    } finally {
      setSubmittingPost(false);
    }
  };

  // Handle post deletion
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeletingPost(true);
      
      await postService.deletePost(postId, currentUser.id);
      
      // Update state to remove the deleted post
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      
      toast.success('Recipe deleted successfully');
    } catch (err) {
      console.error('Error deleting post:', err);
      
      if (err.response?.status === 403) {
        toast.error('You do not have permission to delete this recipe');
      } else {
        toast.error('Failed to delete recipe. Please try again.');
      }
    } finally {
      setIsDeletingPost(false);
    }
  };

  // Handle opening the edit modal
  const handleEditPost = (post) => {
    // Make a copy of the post for editing
    setEditPostForm({
      title: post.title || '',
      contentDescription: post.contentDescription || '',
      ingredients: post.ingredients || [],
      instructions: post.instructions || '',
      cookingTime: post.cookingTime || '',
      difficultyLevel: post.difficultyLevel || '',
      cuisineType: post.cuisineType || ''
    });
    
    // Initialize media items state for editing
    const editMedia = [];
    if (post.mediaLinks && post.mediaLinks.length > 0) {
      post.mediaLinks.forEach((url, index) => {
        editMedia.push({
          url,
          type: post.mediaTypes && post.mediaTypes[index] ? post.mediaTypes[index] : '',
          id: Date.now() + index, // Create a unique ID
          blobCreatedByUs: false
        });
      });
    } else if (post.mediaLink) {
      // Legacy format
      editMedia.push({
        url: post.mediaLink,
        type: post.mediaType || '',
        id: Date.now(),
        blobCreatedByUs: false
      });
    }
    
    setEditMediaItems(editMedia);
    setEditingPost(post);
    setShowEditModal(true);
  };

  // Handle changes to the edit form
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'ingredients') {
      // Handle ingredients as an array
      setEditPostForm(prev => ({
        ...prev,
        [name]: value.split('\n').filter(line => line.trim())
      }));
    } else {
      setEditPostForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle submitting post edits
  const handleEditPostSubmit = async (e) => {
    e.preventDefault();
    
    if (!editPostForm.title || !editPostForm.contentDescription) {
      toast.error('Title and description are required');
      return;
    }
    
    try {
      setIsSubmittingEdit(true);
      
      // Create arrays from media items
      const mediaLinks = editMediaItems.map(item => item.url);
      const mediaTypes = editMediaItems.map(item => item.type);
      
      const postData = {
        ...editPostForm,
        mediaLinks,
        mediaTypes,
        // Legacy format
        mediaLink: mediaLinks.length > 0 ? mediaLinks[0] : '',
        mediaType: mediaTypes.length > 0 ? mediaTypes[0] : ''
      };
      
      const response = await postService.updatePost(editingPost.id, postData, currentUser.id);
      const updatedPost = response.data;
      
      // Update posts list with the updated post
      setPosts(prev => prev.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      ));
      
      // Close the modal
      setShowEditModal(false);
      setEditingPost(null);
      
      toast.success('Recipe updated successfully!');
    } catch (err) {
      console.error('Error updating post:', err);
      
      if (err.response?.status === 403) {
        toast.error('You do not have permission to edit this recipe');
      } else {
        toast.error('Failed to update recipe. Please try again.');
      }
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleNewCommentChange = (postId, value) => {
    setNewComment(prev => ({
      ...prev,
      [postId]: value
    }));
  };

  // UPDATED: handleNewCommentSubmit to create notifications
  const handleNewCommentSubmit = async (postId) => {
    if (!newComment[postId]) return;
    
    try {
      setSubmittingComment(true);
      
      // Get the post (to get post owner for notification)
      const post = posts.find(p => p.id === postId);
      if (!post) {
        throw new Error('Post not found');
      }
      
      const commentData = {
        postId,
        userId: currentUser.id,
        commentText: newComment[postId],
        timestamp: new Date(),
        postOwnerId: post.userId // Add post owner ID for notification
      };
      
      console.log("Submitting comment with data:", commentData);
      
      // Now we call the backend with the postId in the URL path
      const response = await commentService.createComment(commentData, currentUser.id);
      
      // Create comment with user data already included
      const createdComment = response.data;
      
      // Update comments list with the new comment AND associated user data
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), createdComment]
      }));
      
      // Make sure the users state includes the current user with complete info
      setUsers(prev => ({
        ...prev,
        [currentUser.id]: {
          ...prev[currentUser.id],
          ...currentUser,
          // Ensure current user has proper email display
          username: currentUser.email ? currentUser.email.split('@')[0] : currentUser.username,
          email: currentUser.email
        }
      }));
      
      // Clear the comment input
      setNewComment(prev => ({
        ...prev,
        [postId]: ''
      }));
      
      // Create notification for post owner (if different from commenter)
      if (post.userId !== currentUser.id) {
        try {
          const notificationData = {
            userId: post.userId, // Post owner gets the notification
            message: `${currentUser.email ? currentUser.email.split('@')[0] : 'Someone'} commented on your post: "${commentData.commentText.substring(0, 30)}${commentData.commentText.length > 30 ? '...' : ''}"`,
            type: "comment",
            sourceId: postId,
            sourceType: "post", 
            actionUserId: currentUser.id,
            timestamp: new Date(),
            read: false
          };
          
          await notificationService.createNotification(notificationData);
          console.log("Comment notification created successfully");
        } catch (notifyErr) {
          console.error("Failed to create notification:", notifyErr);
          // Continue even if notification fails
        }
      }
      
      toast.success('Comment posted successfully!');
    } catch (err) {
      console.error('Error creating comment:', err);
      console.error('Error details:', err.response?.data || err.message);
      toast.error('Failed to post comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // UPDATED: handleDeleteComment to use proper API
  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    try {
      await commentService.deleteComment(commentId);
      
      // Update comments state
      setComments(prev => ({
        ...prev,
        [postId]: prev[postId].filter(comment => comment.id !== commentId)
      }));
      
      toast.success('Comment deleted successfully');
    } catch (err) {
      console.error('Error deleting comment:', err);
      toast.error('Failed to delete comment. Please try again.');
    }
  };

  // UPDATED: handleEditComment to store postId
  const handleEditComment = (postId, commentId) => {
    const comment = comments[postId].find(c => c.id === commentId);
    if (comment) {
      setEditingComment({ 
        id: commentId, 
        postId,
        text: comment.commentText 
      });
    }
  };

  // UPDATED: handleSaveEditedComment to use proper API
  const handleSaveEditedComment = async () => {
    if (!editingComment.id || !editingComment.text.trim()) return;
    
    try {
      const commentData = {
        commentText: editingComment.text
      };
      
      // Use updateComment API method
      await commentService.updateComment(editingComment.id, editingComment.text);
      
      // Update comments state
      setComments(prev => ({
        ...prev,
        [editingComment.postId]: prev[editingComment.postId].map(comment => 
          comment.id === editingComment.id 
            ? { ...comment, commentText: editingComment.text } 
            : comment
        )
      }));
      
      setEditingComment({ id: null, postId: null, text: '' });
      toast.success('Comment updated successfully');
    } catch (err) {
      console.error('Error updating comment:', err);
      toast.error('Failed to update comment. Please try again.');
    }
  };

  // UPDATED: handleLikeToggle to create notifications
  const handleLikeToggle = async (postId) => {
    const currentLikes = likes[postId] || [];
    const userLike = currentLikes.find(like => like.userId === currentUser.id);
    
    // Get the post (to get post owner for notification)
    const post = posts.find(p => p.id === postId);
    if (!post) {
      console.error('Post not found');
      return;
    }
    
    if (userLike) {
      // User already liked the post, so unlike it
      try {
        await likeService.deleteLike(userLike.id);
        // Update likes state
        setLikes(prev => ({
          ...prev,
          [postId]: prev[postId].filter(like => like.id !== userLike.id)
        }));
      } catch (err) {
        console.error('Error removing like:', err);
      }
    } else {
      // User hasn't liked the post, so like it
      try {
        const likeData = {
          postId,
          userId: currentUser.id,
          postOwnerId: post.userId // Add post owner ID for notification
        };
        const response = await likeService.createLike(likeData);
        const createdLike = response.data;
        // Update likes state
        setLikes(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), createdLike]
        }));
        
        // Create notification for post owner (if different from liker)
        if (post.userId !== currentUser.id) {
          try {
            const notificationData = {
              userId: post.userId, // Post owner gets the notification
              message: `${currentUser.email ? currentUser.email.split('@')[0] : 'Someone'} liked your post: "${post.title || 'Recipe'}"`,
              type: "like",
              sourceId: postId,
              sourceType: "post",
              actionUserId: currentUser.id,
              timestamp: new Date(),
              read: false
            };
            
            await notificationService.createNotification(notificationData);
            console.log("Like notification created successfully");
          } catch (notifyErr) {
            console.error("Failed to create notification:", notifyErr);
            // Continue even if notification fails
          }
        }
      } catch (err) {
        console.error('Error adding like:', err);
      }
    }
  };

  // Implement proper bookmark toggle functionality
  const handleBookmarkToggle = async (post) => {
    try {
      // Check if post is already bookmarked
      if (bookmarkedPosts[post.id]) {
        // If bookmarked, remove it
        await bookmarkService.deleteBookmark(bookmarkedPosts[post.id].id);
        
        // Update state
        setBookmarkedPosts(prev => {
          const updated = {...prev};
          delete updated[post.id];
          return updated;
        });
        
        toast.success('Post removed from bookmarks');
      } else {
        // If not bookmarked, add it
        const bookmarkData = {
          userId: currentUser.id,
          resourceId: post.id,
          resourceType: "post",
          title: post.title || "Recipe post",
          note: post.contentDescription?.substring(0, 100) || "",
          tags: post.cuisineType ? [post.cuisineType] : []
        };
        
        const response = await bookmarkService.createBookmark(bookmarkData);
        
        // Update state
        setBookmarkedPosts(prev => ({
          ...prev,
          [post.id]: response.data
        }));
        
        toast.success('Post added to bookmarks');
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
      toast.error("Failed to bookmark post. Please try again.");
    }
  };

  // Handle share functionality
  const handleShare = (postId) => {
    try {
      // Get the post URL
      const postUrl = `${window.location.origin}/posts/${postId}`;
      
      // Check if Web Share API is available
      if (navigator.share) {
        navigator.share({
          title: 'Check out this recipe on CookBook!',
          url: postUrl
        })
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing:', error));
      } else {
        // Fallback for browsers that don't support the Web Share API
        // Copy to clipboard
        navigator.clipboard.writeText(postUrl)
          .then(() => {
            toast.success('Recipe link copied to clipboard!');
          })
          .catch(err => {
            console.error('Failed to copy link:', err);
            toast.error('Failed to copy link. Please try again.');
          });
      }
    } catch (err) {
      console.error('Error sharing post:', err);
      toast.error('Failed to share post. Please try again.');
    }
  };

  const isPostLikedByUser = (postId) => {
    const postLikes = likes[postId] || [];
    return postLikes.some(like => like.userId === currentUser.id);
  };

  // Focus comment input method for RecipeCard
  const focusCommentInput = (postId) => {
    const commentInputId = `comment-input-${postId}`;
    const commentInput = document.getElementById(commentInputId);
    if (commentInput) {
      commentInput.focus();
    }
  };

  // Updated getDisplayName function to use fetchUserProfile
  const getDisplayName = (userId) => {
    // If we don't have the user data yet, fetch it
    if (!users[userId] || (!users[userId].email && !users[userId].username)) {
      fetchUserProfile(userId);
      return `User ${userId.substring(0, 6)}`;
    }
    
    // If we have the email, use that for display
    if (users[userId].email) {
      return users[userId].email.split('@')[0];
    }
    
    // Fallback to username or ID
    return users[userId].username || `User ${userId.substring(0, 6)}`;
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading recipes...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger">{error}</div>
        <Button onClick={fetchPosts}>Try Again</Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col lg={8} className="mx-auto">
          {/* Create Post Button */}
          <Card className="custom-card mb-4 text-center">
            <Card.Body className="py-4">
              <h5 className="mb-3">Want to share a recipe or cooking tip?</h5>
              <Button 
                variant="primary"
                onClick={() => navigate('/create-recipe')}
              >
                <FaPlus className="me-2" /> Create New Recipe
              </Button>
            </Card.Body>
          </Card>
          
          {/* Posts Feed */}
          {posts.length === 0 ? (
            <div className="text-center py-5">
              <h4>No recipes yet</h4>
              <p className="text-muted">Be the first to share something!</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="mb-4">
                {/* Recipe Card Component */}
                <RecipeCard 
                  post={post}
                  user={users[post.userId] || {}}
                  isLiked={isPostLikedByUser(post.id)}
                  isBookmarked={!!bookmarkedPosts[post.id]}
                  commentsCount={(comments[post.id] || []).length}
                  likeCount={(likes[post.id] || []).length}
                  onLike={() => handleLikeToggle(post.id)}
                  onBookmark={() => handleBookmarkToggle(post)}
                  onComment={() => focusCommentInput(post.id)}
                  onShare={() => handleShare(post.id)}
                  jsxMode="false"
                />
                
                {/* Comment Section */}
                <Card className="custom-card mb-4">
                  <Card.Footer className="bg-white">
                    {/* Comment List */}
                    {comments[post.id] && comments[post.id].length > 0 && (
                      <div className="mb-3">
                        {comments[post.id].map(comment => (
                          <div key={comment.id} className="d-flex mb-2">
                            <FaUserCircle size={30} className="text-secondary me-2 mt-1" />
                            <div className="bg-light p-2 rounded flex-grow-1">
                              <div className="d-flex justify-content-between">
                                <strong>
                                  {/* UPDATED: Improved user display logic */}
                                  {getDisplayName(comment.userId)}
                                </strong>
                                <div>
                                  <small className="text-muted me-2">
                                    {formatTimeAgo(comment.timestamp)}
                                  </small>
                                  {comment.userId === currentUser.id && (
                                    <Button 
                                      variant="link" 
                                      className="p-0 text-primary me-2" 
                                      onClick={() => handleEditComment(post.id, comment.id)}
                                    >
                                      <FaEdit size={14} />
                                    </Button>
                                  )}
                                  {(comment.userId === currentUser.id || post.userId === currentUser.id) && (
                                    <Button 
                                      variant="link" 
                                      className="p-0 text-danger" 
                                      onClick={() => handleDeleteComment(post.id, comment.id)}
                                    >
                                      <FaTrash size={14} />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <p className="mb-0">{comment.commentText}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Add Comment Form */}
                    <div className="d-flex">
                      <FaUserCircle size={30} className="text-secondary me-2 mt-1" />
                      <Form className="flex-grow-1 d-flex">
                        <Form.Control
                          id={`comment-input-${post.id}`}
                          type="text"
                          placeholder="Write a comment..."
                          value={newComment[post.id] || ''}
                          onChange={(e) => handleNewCommentChange(post.id, e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleNewCommentSubmit(post.id);
                            }
                          }}
                        />
                        <Button
                          variant="primary"
                          className="ms-2 post-button"
                          disabled={submittingComment || !newComment[post.id]}
                          onClick={() => handleNewCommentSubmit(post.id)}
                        >
                          Post
                        </Button>
                      </Form>
                    </div>
                  </Card.Footer>
                </Card>
              </div>
            ))
          )}
        </Col>
      </Row>

      {/* Comment Edit Modal */}
      <Modal show={!!editingComment.id} onHide={() => setEditingComment({ id: null, text: '' })}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Comment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Control
                as="textarea"
                rows={3}
                value={editingComment.text}
                onChange={(e) => setEditingComment(prev => ({ ...prev, text: e.target.value }))}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditingComment({ id: null, text: '' })}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveEditedComment} className="post-button">
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Post Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Recipe</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditPostSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Recipe Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={editPostForm.title || ''}
                onChange={handleEditFormChange}
                placeholder="Name of your dish or cooking technique"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Share the story behind this recipe or skill"
                name="contentDescription"
                value={editPostForm.contentDescription || ''}
                onChange={handleEditFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ingredients</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="List your ingredients, one per line"
                name="ingredients"
                value={editPostForm.ingredients?.join('\n') || ''}
                onChange={handleEditFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Instructions</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="Share the step-by-step cooking process"
                name="instructions"
                value={editPostForm.instructions || ''}
                onChange={handleEditFormChange}
              />
            </Form.Group>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Cooking Time</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. 30 mins"
                    name="cookingTime"
                    value={editPostForm.cookingTime || ''}
                    onChange={handleEditFormChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Difficulty Level</Form.Label>
                  <Form.Select
                    name="difficultyLevel"
                    value={editPostForm.difficultyLevel || ''}
                    onChange={handleEditFormChange}
                  >
                    <option value="">Select difficulty</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Cuisine Type</Form.Label>
                  <Form.Select
                    name="cuisineType"
                    value={editPostForm.cuisineType || ''}
                    onChange={handleEditFormChange}
                  >
                    <option value="">Select cuisine</option>
                    <option value="Italian">Italian</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Mexican">Mexican</option>
                    <option value="Indian">Indian</option>
                    <option value="Japanese">Japanese</option>
                    <option value="French">French</option>
                    <option value="Thai">Thai</option>
                    <option value="American">American</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            {/* Add MediaUpload for editing */}
            <Form.Group className="mb-3">
              <Form.Label>Photos/Videos</Form.Label>
              <MediaUpload 
                onChange={items => setEditMediaItems(items)} 
                maxItems={3}
                initialItems={editMediaItems}
                jsxMode="false"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleEditPostSubmit}
            disabled={isSubmittingEdit}
            className="post-button"
          >
            {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Toast Container for notifications */}
      <ToastContainer position="bottom-right" autoClose={3000} />

      {/* Add CSS for post button */}
      <style>{`
        .post-button {
          white-space: nowrap;
          min-width: 80px;
          text-align: center;
          padding: 8px 16px;
        }
        
        /* Alternative for missing cooking-pattern.png */
        .cooking-pattern-background {
          background-color: #f8f9fa;
          background-image: linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0), 
                            linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0);
          background-size: 20px 20px;
          background-position: 0 0, 10px 10px;
        }
      `}</style>
    </Container>
  );
};

export default Feed;