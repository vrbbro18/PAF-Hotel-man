import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { FaUtensils, FaUsers, FaBookOpen, FaCarrot, FaLeaf, FaMortarPestle } from 'react-icons/fa';
import '../App.css';

const Home = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to feed if user is already logged in
    if (currentUser) {
      navigate('/feed');
    }
  }, [currentUser, navigate]);

  const featureCards = [
    {
      title: 'Create & Share Recipes',
      description: 'Share your favorite recipes with detailed instructions, ingredients, and beautiful photos.',
      icon: <FaUtensils size={40} className="text-primary mb-3" />,
      link: '/meal-plans',
      animation: 'fade-in'
    },
    {
      title: 'Join Cooking Communities',
      description: 'Connect with like-minded chefs and learn from each other in specialized cooking groups.',
      icon: <FaUsers size={40} className="text-primary mb-3" />,
      link: '/groups',
      animation: 'fade-in'
    },
    {
      title: 'Discover New Cuisines',
      description: 'Explore recipes from around the world and expand your culinary horizons.',
      icon: <FaBookOpen size={40} className="text-primary mb-3" />,
      link: '/feed',
      animation: 'fade-in'
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to CookBook</h1>
          <p className="hero-subtitle">Connect with your friends, share your recipes, and explore the world of culinary delights together.</p>
          <Button 
            className="hero-button"
            onClick={() => navigate('/register')}
          >
            Join Our Community
          </Button>
        </div>
      </div>

      <Container>
        {/* Features Section */}
        <section className="features-section">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold">Why Join CookBook?</h2>
            <p className="lead text-muted">The perfect platform for food enthusiasts and home chefs</p>
          </div>

          <Row>
            {featureCards.map((feature, index) => (
              <Col md={4} key={index} className="mb-4">
                <div className={`feature-card ${feature.animation}`} style={{animationDelay: `${index * 0.2}s`}}>
                  <div className="feature-icon">
                    {feature.icon}
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => navigate(feature.link)}
                  >
                    Explore
                  </Button>
                </div>
              </Col>
            ))}
          </Row>
        </section>

        {/* Popular Categories Section */}
        <section className="popular-categories-section py-5">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold">Explore Popular Categories</h2>
            <p className="lead text-muted">Discover recipes from different cuisines</p>
          </div>

          <Row>
            <Col md={4} className="mb-4">
              <Card className="category-card h-100">
                <div className="category-image">
                  <img 
                    src="https://images.unsplash.com/photo-1533777324565-a040eb52facd?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80" 
                    alt="Italian Cuisine" 
                    className="img-fluid" 
                  />
                  <div className="category-overlay">
                    <h4 className="category-title">Italian</h4>
                    <Button variant="light" size="sm">Explore</Button>
                  </div>
                </div>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="category-card h-100">
                <div className="category-image">
                  <img 
                    src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80" 
                    alt="Vegetarian" 
                    className="img-fluid" 
                  />
                  <div className="category-overlay">
                    <h4 className="category-title">Vegetarian</h4>
                    <Button variant="light" size="sm">Explore</Button>
                  </div>
                </div>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="category-card h-100">
                <div className="category-image">
                  <img 
                    src="https://images.unsplash.com/photo-1702742322469-36315505728f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZGVzc2VydHN8ZW58MHx8MHx8fDA%3D" 
                    alt="Desserts" 
                    className="img-fluid" 
                  />
                  <div className="category-overlay">
                    <h4 className="category-title">Desserts</h4>
                    <Button variant="light" size="sm">Explore</Button>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works-section py-5">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold">How CookBook Works</h2>
            <p className="lead text-muted">Follow these simple steps to get started</p>
          </div>

          <Row className="align-items-center">
            <Col lg={6} className="mb-4">
              <div className="step-card p-4 rounded bg-white shadow-sm">
                <div className="d-flex align-items-center mb-3">
                  <div className="step-number">1</div>
                  <h3 className="ms-3 mb-0">Create Your Account</h3>
                </div>
                <p className="text-muted">Sign up for a free account to access all features of CookBook. Share your culinary journey with like-minded food enthusiasts.</p>
              </div>
            </Col>
            <Col lg={6} className="mb-4">
              <div className="step-card p-4 rounded bg-white shadow-sm">
                <div className="d-flex align-items-center mb-3">
                  <div className="step-number">2</div>
                  <h3 className="ms-3 mb-0">Share Your Recipes</h3>
                </div>
                <p className="text-muted">Upload your favorite recipes with photos, ingredients, and step-by-step instructions for others to try.</p>
              </div>
            </Col>
            <Col lg={6} className="mb-4">
              <div className="step-card p-4 rounded bg-white shadow-sm">
                <div className="d-flex align-items-center mb-3">
                  <div className="step-number">3</div>
                  <h3 className="ms-3 mb-0">Connect With Others</h3>
                </div>
                <p className="text-muted">Follow other chefs, join cooking communities, and engage with posts through likes and comments.</p>
              </div>
            </Col>
            <Col lg={6} className="mb-4">
              <div className="step-card p-4 rounded bg-white shadow-sm">
                <div className="d-flex align-items-center mb-3">
                  <div className="step-number">4</div>
                  <h3 className="ms-3 mb-0">Explore & Learn</h3>
                </div>
                <p className="text-muted">Discover new recipes, cooking techniques, and culinary traditions from around the world.</p>
              </div>
            </Col>
          </Row>
        </section>

        {/* Call to Action Section */}
        <section className="cta-section my-5">
          <h2 className="cta-title">Ready to Start Your Culinary Journey?</h2>
          <p className="cta-description">Join thousands of food enthusiasts and start sharing your recipes today. Create your free account now!</p>
          <Button 
            className="cta-button"
            onClick={() => navigate('/register')}
          >
            Sign Up Now
          </Button>
        </section>

        {/* Testimonials Section */}
        <section className="testimonials-section py-5">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold">What Our Users Say</h2>
            <p className="lead text-muted">Hear from our community of food lovers</p>
          </div>

          <Row>
            <Col md={4} className="mb-4">
              <Card className="testimonial-card h-100">
                <Card.Body className="text-center">
                  <div className="testimonial-avatar mb-3">
                    <img 
                      src="https://randomuser.me/api/portraits/women/32.jpg" 
                      alt="Sarah Johnson" 
                      className="rounded-circle"
                    />
                  </div>
                  <h5>Sarah Johnson</h5>
                  <p className="text-muted mb-3">Home Chef</p>
                  <p>"CookBook has transformed how I share my recipes with friends and family. The interface is intuitive and the community is so supportive!"</p>
                  <div className="testimonial-rating">
                    <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="testimonial-card h-100">
                <Card.Body className="text-center">
                  <div className="testimonial-avatar mb-3">
                    <img 
                      src="https://randomuser.me/api/portraits/men/45.jpg" 
                      alt="Michael Chen" 
                      className="rounded-circle"
                    />
                  </div>
                  <h5>Michael Chen</h5>
                  <p className="text-muted mb-3">Aspiring Chef</p>
                  <p>"I've learned so many new cooking techniques through CookBook. The detailed instructions and photos make it easy to follow along."</p>
                  <div className="testimonial-rating">
                    <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="testimonial-card h-100">
                <Card.Body className="text-center">
                  <div className="testimonial-avatar mb-3">
                    <img 
                      src="https://randomuser.me/api/portraits/women/68.jpg" 
                      alt="Lisa Thompson" 
                      className="rounded-circle"
                    />
                  </div>
                  <h5>Lisa Thompson</h5>
                  <p className="text-muted mb-3">Food Blogger</p>
                  <p>"As a food blogger, CookBook has been an amazing platform to connect with my audience and share exclusive recipes."</p>
                  <div className="testimonial-rating">
                    <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </section>
      </Container>

      {/* Add custom styles for Home page components */}
      <style jsx>{`
        .step-number {
          width: 40px;
          height: 40px;
          background-color: var(--primary-color);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2rem;
        }
        
        .category-card {
          border: none;
          border-radius: var(--border-radius-md);
          overflow: hidden;
          box-shadow: var(--shadow-md);
          transition: all var(--transition-normal);
        }
        
        .category-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
        }
        
        .category-image {
          position: relative;
          height: 250px;
          overflow: hidden;
        }
        
        .category-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-normal);
        }
        
        .category-card:hover .category-image img {
          transform: scale(1.05);
        }
        
        .category-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 20px;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
          color: white;
          text-align: center;
        }
        
        .category-title {
          margin-bottom: 10px;
          font-weight: 700;
        }
        
        .testimonial-card {
          border: none;
          border-radius: var(--border-radius-md);
          box-shadow: var(--shadow-md);
          transition: all var(--transition-normal);
          padding: 20px;
        }
        
        .testimonial-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
        }
        
        .testimonial-avatar img {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border: 3px solid var(--primary-color);
        }
        
        .testimonial-rating {
          color: var(--primary-color);
          font-size: 1.2rem;
        }
      `}</style>
    </div>
  );
};

export default Home;