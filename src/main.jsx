import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const email = 'contact@spoko.site'
const navigationLinks = [
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'about', label: 'About' },
  { id: 'approach', label: 'Approach' },
  { id: 'contact', label: 'Contact' },
]
const flyerClasses = ['flyer-back', 'flyer-middle', 'flyer-front']
const headerFlyerFiles = [
  '1-Spoko Scoops.png',
  '2-Spoko Thai.png',
  '3-Spoko Florist.png',
]

function Arrow({ diagonal = false }) {
  return <span className="arrow" aria-hidden="true">{diagonal ? '↗' : '→'}</span>
}

function App() {
  const [portfolioImages, setPortfolioImages] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [headerCompact, setHeaderCompact] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const [portfolioIndex, setPortfolioIndex] = useState(0)
  const [portfolioPaused, setPortfolioPaused] = useState(false)
  const headerImages = [
    ...headerFlyerFiles.map((file) => portfolioImages.find((image) => image.file === file)).filter(Boolean),
    ...portfolioImages.filter((image) => !headerFlyerFiles.includes(image.file)),
  ].slice(0, 3)

  useEffect(() => {
    const controller = new AbortController()

    fetch(`${import.meta.env.BASE_URL}assets/promo/images.json`, { cache: 'no-store', signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Could not load portfolio images')
        return response.json()
      })
      .then((images) => {
        if (!Array.isArray(images)) throw new Error('Portfolio image list is invalid')
        setPortfolioImages(images)
        setPortfolioIndex(0)
      })
      .catch((error) => {
        if (error.name !== 'AbortError') console.error(error)
      })

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
  }, [])

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('main section[id]'))
    let frame = 0

    const updateNavigation = () => {
      frame = 0
      setHeaderCompact(window.scrollY > 64)

      const sectionLine = Math.min(window.innerHeight * 0.3, 240)
      let currentSection = ''
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= sectionLine) currentSection = section.id
      }
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
        currentSection = sections.at(-1)?.id ?? ''
      }
      setActiveSection(currentSection)
    }

    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateNavigation)
    }

    updateNavigation()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        document.querySelector('.menu-button')?.focus()
      }
    }
    const desktopQuery = window.matchMedia('(min-width: 651px)')
    const closeOnDesktop = (event) => {
      if (event.matches) setMenuOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    desktopQuery.addEventListener('change', closeOnDesktop)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      desktopQuery.removeEventListener('change', closeOnDesktop)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <div className="header-space" id="top">
        <header className={`site-header${headerCompact ? ' is-compact' : ''}`}>
          <a className="wordmark" href="#top" aria-label="Spoko home" onClick={closeMenu}><img className="wordmark-symbol" src="/assets/S.png" alt="" /><span>poko<span className="wordmark-dot">.</span></span></a>
          <nav id="main-navigation" className={menuOpen ? 'nav nav-open' : 'nav'} aria-label="Main navigation">
            {navigationLinks.map(({ id, label }) => <a key={id} href={`#${id}`} aria-current={activeSection === id ? 'location' : undefined} onClick={closeMenu}>{label}</a>)}
          </nav>
          <a className="header-cta" href={`mailto:${email}`}>Let's talk <Arrow diagonal /></a>
          <button className="menu-button" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen((open) => !open)}>
            <span></span><span></span>
          </button>
        </header>
      </div>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-content">
            <div className="hero-copy">
              <p className="eyebrow hero-eyebrow"><span className="orange-line"></span> INDEPENDENT CREATIVE STUDIO</p>
              <h1 id="hero-title">Make it<br /><span className="italic-word">mean</span> <span className="hero-something">something<span className="period">.</span></span></h1>
              <div className="hero-bottom">
                <p>Thoughtful creative work for people with something to say. Simple, considered, and full of character.</p>
              </div>
              <a className="contact-button" href={`mailto:${email}?subject=Let's%20work%20together`}>Start a conversation <Arrow diagonal /></a>
            </div>
            <div className="hero-art flyer-stack" role="img" aria-label="A stack of promotional designs from the portfolio">
              {headerImages.map((image, index) => <div key={image.file} className={`flyer ${flyerClasses[index]}`}><img src={image.src} alt="" /></div>)}
              <div className="flyer-stack-label">CAMPAIGNS <span>•</span> CONTENT <span>•</span> SOCIAL</div>
            </div>
          </div>
        </section>

        <section className="portfolio section-pad" id="portfolio" aria-labelledby="portfolio-title">

          <div className="portfolio-heading">
            <h2 id="portfolio-title">Made with <em>feeling.</em></h2>
          </div>
          {portfolioImages.length > 0 && <div className="portfolio-gallery" onMouseEnter={() => setPortfolioPaused(true)} onMouseLeave={() => setPortfolioPaused(false)} onFocusCapture={() => setPortfolioPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPortfolioPaused(false) }}>
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

        <section className="intro section-pad" id="about">
          <div className="intro-main reveal">
            <p className="section-kicker"><span>01</span> A SMALL TEAM, WITH ROOM FOR BIG IDEAS</p>
            <h2>Small studio.<br /><em>Big feeling.</em></h2>
            <p className="intro-description">We’re a team of five bringing strategy, design and promotion together. Work directly with the people shaping your brand, building your website and putting your message out into the world.</p>
          </div>
          <div className="service-grid">
            <article className="service-card reveal">
              <div className="service-image"><img src="/assets/promo/6-Spoko Pizza.png" alt="Website design shown on a warm, colourful campaign layout" loading="lazy" /></div>
              <div className="service-meta"><span>02</span><span>WEB</span></div>
              <h3>Websites</h3><p>A thoughtful, easy-to-use home for your business that turns a first visit into a next step.</p>
            </article>
            <article className="service-card reveal">
              <div className="service-image"><img src="/assets/promo/3-Spoko Florist.png" alt="Floral graphic design with expressive typography" loading="lazy" /></div>
              <div className="service-meta"><span>03</span><span>DESIGN</span></div>
              <h3>Graphic design</h3><p>Distinctive visuals and a consistent look that make your brand easy to recognise.</p>
            </article>
            <article className="service-card reveal">
              <div className="service-image"><img src="/assets/promo/2-Spoko Thai.png" alt="Restaurant social promotion artwork for a food business" loading="lazy" /></div>
              <div className="service-meta"><span>04</span><span>SOCIAL</span></div>
              <h3>Social promotion</h3><p>Useful, engaging content that keeps you part of the conversation with your audience.</p>
            </article>
            <article className="service-card reveal">
              <div className="service-image"><img src="/assets/promo/1-Spoko Scoops.png" alt="Bright ice cream advertising campaign creative" loading="lazy" /></div>
              <div className="service-meta"><span>05</span><span>REACH</span></div>
              <h3>Advertising</h3><p>Focused campaigns that put your message in front of the people most likely to care.</p>
            </article>
          </div>
        </section>



        <section className="approach section-pad" id="approach">
          <div className="approach-heading reveal">
            <h2>Less noise.<br /><em>More impact.</em></h2>
            <p>Good design and advertising start with a reason. We find the clearest way to tell your story, then make every piece work together—so your marketing feels recognisable, reaches the right people and gives them a reason to act.</p>
          </div>
          <div className="process-track">
            <article className="process-step reveal"><span className="process-marker">01</span><p className="process-label">TALK IT THROUGH</p><h3>Start with a proper chat</h3><p>We get to know you, your business and what you’re hoping to do. We’ll trade ideas, ask questions and work out who we need to reach.</p></article>
            <article className="process-step reveal"><span className="process-marker">02</span><p className="process-label">MAKE A PLAN TOGETHER</p><h3>Choose a direction</h3><p>We’ll bring a few ideas to the table and talk them through with you. Together, we settle on the design, message and best way forward.</p></article>
            <article className="process-step reveal"><span className="process-marker">03</span><p className="process-label">MAKE THE PIECES</p><h3>Build what you need</h3><p>With a direction agreed, we create the website, graphics and campaign. We keep you in the loop as the work takes shape.</p></article>
            <article className="process-step reveal"><span className="process-marker">04</span><p className="process-label">PUT IT INTO PRACTICE</p><h3>Get it out there</h3><p>We help get everything live, from publishing the site to rolling out social posts and ads. Then we look at what’s working and decide the next step with you.</p></article>
          </div>
        </section>

        <section className="contact section-pad" id="contact">
          <div className="contact-card reveal">
            <div className="contact-content">
              <p className="contact-kicker"><span className="orange-line"></span> HAVE A GOOD ONE IN MIND?</p>
              <h2>Let's make it <em>happen.</em></h2>
              <p className="contact-note">Tell us what you’re working on. We’ll bring the right people and ideas to the table.</p>
            </div>
            <a className="contact-button" href={`mailto:${email}?subject=Let's%20work%20together`}>Start a conversation <Arrow diagonal /></a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand">
            <a className="wordmark footer-logo" href="#top" aria-label="Spoko home"><img className="wordmark-symbol" src="/assets/S.png" alt="" /><span>poko<span className="wordmark-dot">.</span></span></a>
            <p>Thoughtful ideas.<br />Made with character.</p>
          </div>
          <div className="footer-column">
            <p className="footer-label">Explore</p>
            <nav className="footer-nav" aria-label="Footer navigation">
              {navigationLinks.map(({ id, label }) => <a key={id} href={`#${id}`}>{label}</a>)}
            </nav>
          </div>
          <div className="footer-column">
            <p className="footer-label">Say hello</p>
            <a className="footer-email" href={`mailto:${email}`}>{email} <Arrow diagonal /></a>
            <div className="footer-location">
              <p className="footer-label">Based in</p>
              <p>Springfield, 4300<br />Queensland, Australia</p>
            </div>
          </div>
          <a className="footer-back-top" href="#top"><span>Back to top</span><span className="footer-back-top-icon" aria-hidden="true">↑</span></a>
        </div>
        <div className="footer-bottom">
          <div className="footer-legal"><small>© {new Date().getFullYear()} Spoko</small><span>ABN: 27 526 508 101</span></div>
          <a className="footer-credit" href="https://revilodev.com" target="_blank" rel="noopener noreferrer" aria-label="Site by ReviloDev, 2026 (opens in a new tab)">
            <img className="credit-logo" src={`${import.meta.env.BASE_URL}assets/revilodev.png`} width="40" height="40" alt="" />
            <span className="credit-copy"><span>Site by</span><strong>ReviloDev</strong></span>
            <span className="credit-year">2026</span>
            <Arrow diagonal />
          </a>
        </div>
      </footer>
    </>
  )
}

createRoot(document.getElementById('root')).render(<App />)
