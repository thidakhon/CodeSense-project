import React from 'react'
import styled from 'styled-components'
import heroImage from '/hero.png'

const Wrap = styled.section`
  position: relative;
  z-index: 1;
  width: min(1200px, 92vw);
  margin: 88px auto 28px;
  padding: clamp(18px, 4vw, 28px);
  border-radius: var(--radius-2xl);
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
  box-shadow: 0 20px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04);
  backdrop-filter: blur(8px);
  overflow: hidden;

  @media (max-width: 730px) {
    margin-top: 76px;
    padding: 18px;
    border-radius: 18px;
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: clamp(20px, 4vw, 40px);
  align-items: center;

  @media (max-width: 930px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 730px) {
    grid-template-columns: 1fr;
  }
`

const Left = styled.div`
  display: grid;
  gap: 16px;
  position: relative;
  z-index: 2;
`

const SmallVerb = styled.div`
  text-transform: uppercase;
  font-weight: 800;
  letter-spacing: 0.18em;
  font-size: 12px;
  opacity: .9;
  color: var(--muted-200);
`

const Title = styled.h1`
  margin: 0;
  font-size: clamp(32px, 5vw, 56px);
  line-height: 1.02;
  letter-spacing: -0.02em;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 0 18px rgba(255,62,200,0.18);
  .grad {
    background: linear-gradient(90deg, var(--neon-pink), var(--neon-cyan));
    -webkit-background-clip: text; background-clip: text; color: transparent;
    filter: drop-shadow(0 0 12px rgba(0,230,255,0.25));
  }
`

const Subtitle = styled.p`
  margin: 4px 0 0 0;
  font-size: clamp(15px, 2.2vw, 18px);
  color: rgba(255,255,255,0.88);
`

const Ctas = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
`

const Right = styled.div`
  position: relative;
  min-height: 280px;
  display: grid;
  place-items: center;
  isolation: isolate;
`

const Illustration = styled.div`
  width: min(520px, 90%);
  aspect-ratio: 1.2 / 1;
  border-radius: 28px;
  background:
    radial-gradient(closest-side, rgba(255,62,200,0.15), transparent 70%),
    radial-gradient(closest-side, rgba(0,230,255,0.12), transparent 70%),
    url(${heroImage}) center / cover no-repeat;
  box-shadow: 0 10px 50px rgba(0,0,0,0.55), 0 0 60px rgba(0,230,255,0.15), 0 0 40px rgba(255,62,200,0.12);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(600px 300px at 50% 0%, rgba(255,255,255,0.06), transparent 60%);
    mix-blend-mode: screen;
    pointer-events: none;
  }
`

const Particles = styled.div`
  position: absolute; inset: -10%; z-index: -1; pointer-events: none;
  background: radial-gradient(2px 2px at 10% 20%, rgba(255,255,255,0.35), transparent 60%),
              radial-gradient(2px 2px at 80% 30%, rgba(0,230,255,0.45), transparent 60%),
              radial-gradient(2px 2px at 30% 80%, rgba(255,62,200,0.45), transparent 60%),
              radial-gradient(2px 2px at 60% 60%, rgba(255,255,255,0.35), transparent 60%);
  filter: blur(0.2px);
  animation: particlesFloat 12s ease-in-out infinite alternate;

  @keyframes particlesFloat {
    from { transform: translateY(0) }
    to { transform: translateY(-8px) }
  }
`

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 14px;

  @media (max-width: 730px) {
    grid-template-columns: repeat(3, 1fr);
  }
`

const StatCard = styled.div`
  text-align: left;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);

  .num {
    font-size: clamp(26px, 4vw, 40px);
    font-weight: 900;
    background: linear-gradient(90deg, var(--neon-pink), var(--neon-cyan));
    -webkit-background-clip: text; background-clip: text; color: transparent;
    filter: drop-shadow(0 0 10px rgba(0,230,255,0.18));
    letter-spacing: -0.01em;
  }
  .label { opacity: .8; font-size: 12px; }
`

export default function Hero() {
  return (
    <Wrap role="banner" aria-label="CodeSense hero">
      <Grid>
        <Left>
          <SmallVerb>CodeSense</SmallVerb>
          <Title>
            Understand <span className="grad">Code</span> Instantly
          </Title>
          <Subtitle>
            Paste or upload code — get step-by-step explanations, better patterns, and smart guidance.
          </Subtitle>
          <Ctas>
            <a href="#app-chat" className="btn-neon" aria-label="Try CodeSense now">Try CodeSense</a>
            <a href="#app-chat" className="btn-glass" aria-label="Paste Code">Paste Code</a>
          </Ctas>
          <Stats aria-label="Key metrics">
            <StatCard>
              <div className="num">2K+</div>
              <div className="label">Explained snippets</div>
            </StatCard>
            <StatCard>
              <div className="num">0.1s</div>
              <div className="label">First token latency</div>
            </StatCard>
            <StatCard>
              <div className="num">58</div>
              <div className="label">Languages supported</div>
            </StatCard>
          </Stats>
        </Left>
        <Right>
          <Particles aria-hidden="true" />
          <Illustration role="img" aria-label="Neon code illustration" />
        </Right>
      </Grid>
    </Wrap>
  )
}
