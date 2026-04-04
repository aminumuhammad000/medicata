import React from 'react'
import './App.css'

function App() {
  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="container">
          <div className="logo-text">
            <span>⚕️</span> Medicata
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How it works</a>
            <a href="#faq" className="nav-link">FAQ</a>
          </div>
          <div className="nav-cta">
            <button className="btn btn-primary">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <h1>The future of <span style={{ color: 'var(--primary)' }}>Healthcare</span> is here.</h1>
              <p>Book consultations, manage prescriptions, and order medicines all from your phone. Medicata connects you with top healthcare professionals in minutes.</p>
              <div className="hero-btns">
                <button className="btn btn-primary">Download App</button>
                <button className="btn btn-outline">Explore Doctors</button>
              </div>
            </div>
            <div className="hero-image">
              {/* Image / Illustration Placeholder */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '80px', marginBottom: '20px' }}>📱</div>
                <h3 style={{ color: '#ccc' }}>Mobile App Preview</h3>
                <p style={{ color: '#999' }}>Experience the full journey</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <h2>500+</h2>
              <p>Certified Doctors</p>
            </div>
            <div className="stat-item">
              <h2>50k+</h2>
              <p>Happy Patients</p>
            </div>
            <div className="stat-item">
              <h2>200+</h2>
              <p>Partner Pharmacies</p>
            </div>
            <div className="stat-item">
              <h2>24/7</h2>
              <p>AI Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="features">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: '800' }}>Everything you need for your <span style={{ color: 'var(--primary)' }}>Health</span></h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '18px' }}>Designed for modern patients and busy doctors.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Consultations</h3>
              <p>Book video, audio, or in-person visits with specialized doctors. No more queues.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💊</div>
              <h3>Pharmacy</h3>
              <p>Send your digital prescriptions to partner pharmacies and get medicines delivered.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Assistant</h3>
              <p>Medi, our AI health assistant, helps you understand symptoms and find the right care.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#f8f9fa', padding: '60px 0', borderTop: '1px solid #eee' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="logo-text" style={{ justifyContent: 'center', marginBottom: '32px' }}>
            <span>⚕️</span> Medicata
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Empowering African Healthcare through Technology.</p>
          <div style={{ borderTop: '1px solid #eee', paddingTop: '32px', color: '#999', fontSize: '14px' }}>
            © 2026 Medicata Health. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
