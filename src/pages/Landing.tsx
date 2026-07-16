import { Link, useNavigate } from 'react-router-dom'
import './Landing.css'

export const EXAMPLE_PROMPTS = [
  { label: 'Financial', text: 'I want to buy a house in the next five years.' },
  { label: 'Travel', text: 'Save for a Europe backpacking trip.' },
  { label: 'Career', text: 'Get promoted to senior engineer.' },
  { label: 'Personal', text: 'Quit drinking.' },
  { label: 'Personal', text: 'Build a small business on the side.' },
]

export function Landing() {
  const navigate = useNavigate()

  function startWith(text?: string) {
    navigate('/app', { state: text ? { draft: text } : undefined })
  }

  return (
    <div className="landing">
      <section className="landing__hero">
        <div className="landing__scene" aria-hidden>
          <div className="landing__sky" />
          <div className="landing__sun" />
          <div className="landing__haze" />
          <svg
            className="landing__terrain"
            viewBox="0 0 1440 560"
            preserveAspectRatio="none"
          >
            <path
              className="landing__ridge landing__ridge--far"
              d="M0 260 C180 200 320 310 520 240 C720 170 880 250 1080 210 C1240 180 1360 230 1440 200 L1440 560 L0 560 Z"
            />
            <path
              className="landing__ridge landing__ridge--mid"
              d="M0 300 C220 250 400 340 620 290 C860 230 980 320 1180 280 C1300 255 1380 290 1440 270 L1440 560 L0 560 Z"
            />
            <path
              className="landing__ridge landing__ridge--near"
              d="M0 360 C260 320 420 400 700 350 C980 295 1120 390 1440 340 L1440 560 L0 560 Z"
            />
          </svg>
          <div className="landing__ground" />
          <div className="landing__path" />
        </div>

        <div className="landing__content">
          <p className="landing__brand">Horizon</p>
          <h1 className="landing__support">
            Write a sentence. Watch a multi-year goal take shape.
          </h1>
          <button type="button" className="btn btn--primary landing__cta" onClick={() => startWith()}>
            Start writing
          </button>
        </div>
      </section>

      <section className="landing__ideas">
        <h2>Ideas to begin with</h2>
        <p className="landing__ideas-lead">Tap a sentence to open the journal with it ready to save.</p>
        <ul className="landing__prompts">
          {EXAMPLE_PROMPTS.map((p) => (
            <li key={p.text}>
              <button type="button" onClick={() => startWith(p.text)}>
                <span className="landing__prompt-label">{p.label}</span>
                <span className="landing__prompt-text">{p.text}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="landing__foot">
          Already journaling? <Link to="/app">Open app</Link>
        </p>
      </section>
    </div>
  )
}
