import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const email = 'spoko.reception@gmail.com'

function Arrow({ diagonal = false }) {
  return <span className="arrow" aria-hidden="true">{diagonal ? '↗' : '→'}</span>
}

function App() {
  const [portfolioImages, setPortfolioImages] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [portfolioIndex, setPortfolioIndex] = useState(0)
  const [portfolioPaused, setPortfolioPaused] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/assets/promo/images.json', { cache: 'no-store', signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Could not load promo images')
        return response.json()
      })
      .then(setPortfolioImages)
      .catch((error) => { if (error.name !== 'AbortError') console.error(error) })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (portfolioPaused || portfolioImages.length < 2) return
    const timer = window.setInterval(() => setPortfolioIndex((index) => (index + 1) % portfolioImages.length), 5000)
    return () => window.clearInterval(timer)
  }, [portfolioPaused, portfolioImages.length])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [portfolioImages.length])

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Spoko home" onClick={closeMenu}><img className="wordmark-symbol" src="/assets/S.svg" alt="" /><span>poko<span className="wordmark-dot">.</span></span></a>
        <nav className={menuOpen ? 'nav nav-open' : 'nav'} aria-label="Main navigation">
          <a href="#about" onClick={closeMenu}>About</a>
          <a href="#approach" onClick={closeMenu}>Approach</a>
          <a href="#portfolio" onClick={closeMenu}>Portfolio</a>
          <a href="#contact" onClick={closeMenu}>Contact</a>
        </nav>
        <a className="header-cta" href={`mailto:${email}`}>Let's talk <Arrow diagonal /></a>
        <button className="menu-button" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          <span></span><span></span>
        </button>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-topline"><span>Independent creative studio</span><span>Springfield, 4300 <span className="location-star">✳</span></span></div>
          <div className="hero-content">
            <div className="hero-copy">
              <p className="eyebrow hero-eyebrow"><span className="orange-line"></span> GOOD IDEAS FEEL DIFFERENT</p>
              <h1 id="hero-title">Make it<br /><span className="italic-word">mean</span> <span className="hero-something">something<span className="period">.</span></span></h1>
              <div className="hero-bottom">
                <p>Thoughtful creative work for people with something to say. Simple, considered, and full of character.</p>
                <a className="round-link" href="#about" aria-label="Explore Spoko"><Arrow diagonal /></a>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="art-circle art-circle-outer"></div>
              <div className="art-circle art-circle-middle"></div>
              <div className="art-circle art-circle-inner"></div>
              <div className="art-core"><img src="/assets/Reversed%20S.svg" alt="" /></div>
              <div className="orbit-label orbit-label-top">THINK • MAKE • FEEL •</div>
              <div className="orbit-label orbit-label-bottom">SPOKO STUDIO / 01</div>
              <div className="spark spark-one">✳</div>
              <div className="spark spark-two">✳</div>
            </div>
          </div>
          <div className="hero-foot"><span>Scroll to explore</span><span className="down-arrow">↓</span><span>01 / 03</span></div>
        </section>

        <section className="intro section-pad" id="about">
          <div className="section-label reveal"><span className="label-number">01</span><span>WHO WE ARE</span></div>
          <div className="intro-main reveal">
            <h2>Small studio.<br /><em>Big feeling.</em></h2>
            <div className="intro-side">
              <span className="asterisk">✳</span>
              <p>Spoko is an independent creative studio with a soft spot for the details. We bring clarity, curiosity, and a little potential to every idea.</p>
              <a className="text-link" href={`mailto:${email}?subject=Hello%20Spoko`}>Get to know us <Arrow diagonal /></a>
            </div>
          </div>
        </section>

        <section className="marquee" aria-label="Made to connect">
          <div className="marquee-track" aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => <span key={i}>MADE TO CONNECT <b>✳</b> MADE TO MATTER <b>✳</b> </span>)}
          </div>
        </section>

        <section className="approach section-pad" id="approach">
          <div className="section-label reveal"><span className="label-number">02</span><span>THE APPROACH</span></div>
          <div className="approach-heading reveal">
            <h2>Less noise.<br /><em>More impact.</em></h2>
            <p>Good work starts with listening. From the first conversation to the final detail, we keep the process human and the ideas purposeful.</p>
          </div>
          <div className="principles">
            <article className="principle reveal"><span className="principle-index">01 /</span><h3>Curiosity first</h3><p>We ask the right questions and make room for fresh perspectives.</p><Arrow diagonal /></article>
            <article className="principle reveal"><span className="principle-index">02 /</span><h3>Keep it clear</h3><p>Strong ideas deserve a simple, confident way to be seen.</p><Arrow diagonal /></article>
            <article className="principle reveal"><span className="principle-index">03 /</span><h3>Make it matter</h3><p>Every choice should feel intentional and leave an impression.</p><Arrow diagonal /></article>
          </div>
        </section>

        <section className="portfolio section-pad" id="portfolio" aria-labelledby="portfolio-title">
          <div className="section-label reveal"><span className="label-number">03</span><span>OUR PORTFOLIO</span></div>
          <div className="portfolio-heading reveal">
            <h2 id="portfolio-title">Made with <em>feeling.</em></h2>
            <p>A selection of ideas brought to life.</p>
          </div>
          {portfolioImages.length > 0 && <div className="portfolio-gallery reveal" onMouseEnter={() => setPortfolioPaused(true)} onMouseLeave={() => setPortfolioPaused(false)} onFocusCapture={() => setPortfolioPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPortfolioPaused(false) }}>
            <div className="portfolio-frame">
              {portfolioImages.map((image, index) => <img key={image.file} className={index === portfolioIndex ? 'portfolio-image is-active' : 'portfolio-image'} src={image.src} alt={image.alt} aria-hidden={index !== portfolioIndex} />)}
            </div>
            <div className="portfolio-controls">
              <span className="portfolio-count">{String(portfolioIndex + 1).padStart(2, '0')} <span>/</span> {String(portfolioImages.length).padStart(2, '0')}</span>
              <div className="portfolio-dots" aria-label="Choose portfolio image">{portfolioImages.map((image, index) => <button key={image.file} type="button" className={index === portfolioIndex ? 'portfolio-dot is-active' : 'portfolio-dot'} aria-label={`Show portfolio image ${index + 1}`} aria-current={index === portfolioIndex ? 'true' : undefined} onClick={() => setPortfolioIndex(index)} />)}</div>
              <div className="portfolio-arrows"><button type="button" aria-label="Previous portfolio image" onClick={() => setPortfolioIndex((index) => (index - 1 + portfolioImages.length) % portfolioImages.length)}>←</button><button type="button" aria-label="Next portfolio image" onClick={() => setPortfolioIndex((index) => (index + 1) % portfolioImages.length)}>→</button></div>
            </div>
          </div>}
        </section>

        <section className="contact section-pad" id="contact">
          <div className="section-label reveal"><span className="label-number">04</span><span>GET IN TOUCH</span></div>
          <div className="contact-content reveal">
            <p className="contact-kicker">HAVE SOMETHING IN MIND?</p>
            <h2>Let's make<br /><em>it happen.</em></h2>
            <a className="contact-button" href={`mailto:${email}?subject=Let's%20work%20together`}>Start a conversation <Arrow diagonal /></a>
          </div>
          <div className="contact-flower" aria-hidden="true">✳</div>
        </section>
      </main>

      <footer className="footer">
        <a className="footer-logo" href="#top">spoko<span>.</span></a>
        <div><span>BASED IN</span><p>Springfield, 4300</p></div>
        <div><span>SAY HELLO</span><p><a href={`mailto:${email}`}>{email}</a></p></div>
        <div className="footer-end"><a href="#top">Back to top ↑</a><small>© {new Date().getFullYear()} SPOKO</small></div>
      </footer>
    </>
  )
}

createRoot(document.getElementById('root')).render(<App />)
