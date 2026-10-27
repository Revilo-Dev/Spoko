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
            <h2>Small studio.<br /><em>Big feeling.</em></h2>
            <div className="intro-side">
              <span className="asterisk">✳</span>
              <p>Spoko is an independent creative studio with a soft spot for the details. We bring clarity, curiosity, and a little potential to every idea.</p>
              <a className="text-link" href={`mailto:${email}?subject=Hello%20Spoko`}>Get to know us <Arrow diagonal /></a>
            </div>
          </div>
        </section>



        <section className="approach section-pad" id="approach">

          <div className="approach-heading reveal">
            <h2>Less noise.<br /><em>More impact.</em></h2>
            <p>Good work starts with listening. From the first conversation to the final detail, we keep the process human and the ideas purposeful.</p>
          </div>
          <div className="principles">
            <article className="principle reveal"><span className="principle-index">01</span><h3>Curiosity first</h3><p>We ask the right questions and make room for fresh perspectives.</p><Arrow diagonal /></article>
            <article className="principle reveal"><span className="principle-index">02</span><h3>Keep it clear</h3><p>Strong ideas deserve a simple, confident way to be seen.</p><Arrow diagonal /></article>
            <article className="principle reveal"><span className="principle-index">03</span><h3>Make it matter</h3><p>Every choice should feel intentional and leave an impression.</p><Arrow diagonal /></article>
          </div>
        </section>

        <section className="contact section-pad" id="contact">

          <div className="contact-content reveal">
            <p className="contact-kicker">HAVE SOMETHING IN MIND?</p>
            <h2>Let's make<br /><em>it happen.</em></h2>
            <a className="contact-button" href={`mailto:${email}?subject=Let's%20work%20together`}>Start a conversation <Arrow diagonal /></a>
          </div>
          <div className="contact-flower" aria-hidden="true">✳</div>
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
