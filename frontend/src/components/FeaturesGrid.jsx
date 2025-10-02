import React from 'react'
import styled from 'styled-components'

const Section = styled.section`
  position: relative;
  z-index: 1;
  width: min(1200px, 92vw);
  margin: 22px auto 34px;
  padding: clamp(18px, 4vw, 28px);
  border-radius: var(--radius-2xl);
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
  box-shadow: 0 20px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04);
  backdrop-filter: blur(8px);

  @media (max-width: 730px) {
    border-radius: 18px;
    padding: 18px;
  }
`

const Heading = styled.h2`
  margin: 0 0 14px 0;
  text-align: center;
  font-size: clamp(22px, 3vw, 28px);
  letter-spacing: 0.02em;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(12px, 2.5vw, 18px);
  align-items: stretch;

  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 730px) {
    grid-template-columns: 1fr;
  }
`

const Card = styled.article`
  position: relative;
  border-radius: var(--radius-2xl);
  padding: clamp(16px, 2.2vw, 22px);
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 10px 40px rgba(0,0,0,0.35);
  transition: transform .18s ease, box-shadow .18s ease;
  will-change: transform, box-shadow;
  display: flex;
  flex-direction: column;
  min-height: 240px;
  height: 100%;

  &:hover { transform: translateY(-4px) scale(1.03); box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(0,230,255,0.14), 0 0 20px rgba(255,62,200,0.12); }
`

const IconWrap = styled.div`
  width: 58px; height: 58px; border-radius: 50%;
  display: grid; place-items: center; margin-bottom: 10px;
  background:
    radial-gradient(closest-side, rgba(0,230,255,0.35), transparent 70%),
    radial-gradient(closest-side, rgba(255,62,200,0.28), transparent 70%);
  box-shadow: 0 0 24px rgba(0,230,255,0.2), inset 0 0 1px rgba(255,255,255,0.25);
  border: 1px solid rgba(255,255,255,0.12);
`

const CardTitle = styled.h3`
  margin: 0 0 6px 0;
  font-size: clamp(18px, 2.2vw, 22px);
`

const CardText = styled.p`
  margin: 0;
  opacity: .9;
  line-height: 1.35;
`

const Visual = styled.div`
  margin-top: 12px;
  padding: 12px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255,62,200,0.08), rgba(0,230,255,0.06));
  border: 1px solid rgba(255,255,255,0.08);
  display: grid; gap: 8px;

  .bigNum {
    font-size: clamp(34px, 6vw, 44px);
    line-height: 1;
    font-weight: 900;
    background: linear-gradient(90deg, var(--neon-pink), var(--neon-cyan));
    -webkit-background-clip: text; background-clip: text; color: transparent;
    letter-spacing: -0.02em;
    filter: drop-shadow(0 0 12px rgba(0,230,255,0.2));
  }
  .snippet {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 12px;
    opacity: .92;
    white-space: pre-wrap;
  }
`

export default function FeaturesGrid() {
  return (
    <Section aria-label="Core Features">
      <Heading>Core Features</Heading>
      <Grid>
        <Card>
          <IconWrap aria-hidden>
            <span aria-hidden role="img">⚡</span>
          </IconWrap>
          <CardTitle>Code Input & Upload</CardTitle>
          <CardText>The platform will allow users to paste or upload code directly into the system. This provides the foundation for generating explanations and insights.</CardText>
          <Visual aria-hidden>
            <div className="bigNum">01</div>
            <div className="snippet">// Paste code or upload a file\nfunction example() { /* ... */ }</div>
          </Visual>
        </Card>

        <Card>
          <IconWrap aria-hidden>
            <span aria-hidden role="img">💡</span>
          </IconWrap>
          <CardTitle>Code Explanation</CardTitle>
          <CardText>
            The tool will analyze the provided code and generate clear explanations, helping users understand structure, logic, and functionality step by step.
          </CardText>
        </Card>

        <Card>
          <IconWrap aria-hidden>
            <span aria-hidden role="img">🤖</span>
          </IconWrap>
          <CardTitle>Knowledge Base</CardTitle>
          <CardText>The system will act as a general programming resource, allowing users to ask broad questions about any language (e.g., "What is a closure in Python?" or "How do I handle asynchronous operations in Node.js?").</CardText>
        </Card>
      </Grid>
    </Section>
  )
}
