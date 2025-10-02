import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import silverImage from '/silver.png'

const Section = styled.section`
  position: relative;
  z-index: 1;
  width: min(1200px, 92vw);
  margin: 18px auto 34px;
  padding: clamp(18px, 4vw, 28px);
  border-radius: var(--radius-2xl);
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
  box-shadow: 0 20px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04);
  backdrop-filter: blur(8px);
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.2fr; /* image left (slightly narrower), content right (wider) */
  gap: clamp(16px, 3vw, 28px);
  align-items: stretch;
  @media (max-width: 980px) { grid-template-columns: 1fr; }
`

const Content = styled.div`
  display: grid; gap: 10px; align-content: start;
`

const Title = styled.h2`
  margin: 0;
  font-family: 'Orbitron', 'Space Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-weight: 800;
  letter-spacing: 0.02em;
  font-size: clamp(22px, 3.4vw, 34px);
  color: var(--neon-pink, #ff3ec8);
`

const SubTitle = styled.h3`
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-weight: 700;
  letter-spacing: 0.02em;
  font-size: clamp(14px, 2vw, 18px);
  color: var(--neon-cyan, #00e6ff);
  opacity: 0.95;
`

const Body = styled.p`
  margin: 6px 0 10px 0;
  color: var(--muted-100, #e6e6f0);
  opacity: 0.92;
  line-height: 1.5;
`

const Bullets = styled.div`
  display: grid; gap: 12px; margin-top: 6px;
`

const Bullet = styled.div`
  display: grid; grid-template-columns: 38px 1fr; gap: 10px; align-items: start;
  padding: 10px 12px; border-radius: 14px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.10);
`

const Icon = styled.div`
  width: 38px; height: 38px; border-radius: 12px;
  display: grid; place-items: center;
  color: #fff;
  background: radial-gradient(closest-side, rgba(255,62,200,0.35), transparent 70%),
              radial-gradient(closest-side, rgba(0,230,255,0.30), transparent 70%);
  box-shadow: 0 0 22px rgba(255,62,200,0.18), 0 0 28px rgba(0,230,255,0.12);
`

const BulletTitle = styled.div`
  font-weight: 800; color: var(--neon-pink, #ff3ec8); margin-bottom: 4px;
`

const BulletText = styled.div`
  color: var(--muted-200, #cfd0dc);
`

const VisualWrap = styled.div`
  position: relative;
  border-radius: calc(var(--radius-2xl) - 6px);
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.10);
  background: radial-gradient(120% 120% at 10% 10%, rgba(255,62,200,0.10), transparent 50%),
              radial-gradient(120% 120% at 90% 0%, rgba(0,230,255,0.10), transparent 55%),
              rgba(0,0,0,0.25);
  min-height: clamp(260px, 38vh, 420px);
  perspective: 900px;
  will-change: transform;

  /* Animated neon border glow */
  &:after {
    content: '';
    position: absolute; inset: -1px;
    pointer-events: none;
    border-radius: inherit;
    background:
      radial-gradient(120% 120% at 10% 0%, rgba(255,62,200,0.28), transparent 60%),
      radial-gradient(120% 120% at 100% 10%, rgba(0,230,255,0.26), transparent 60%);
    filter: blur(10px);
    opacity: 0.55;
    animation: glowPulse 4s ease-in-out infinite;
  }

  @keyframes glowPulse {
    0%, 100% { opacity: 0.45; }
    50% { opacity: 0.75; }
  }
`

const ImageLayer = styled.div`
  position: absolute; inset: 0;
  background: url(${silverImage}) center / cover no-repeat;
  transform: translateZ(0) translateY(var(--parallax, 0px));
  transition: transform .15s ease, filter .2s ease;
  filter: saturate(1.05) contrast(1.02);
`

const OverlayGlow = styled.div`
  pointer-events: none;
  position: absolute; inset: 0;
  background:
    radial-gradient(600px 300px at 20% 10%, rgba(255,62,200,0.20), transparent 60%),
    radial-gradient(600px 300px at 90% 20%, rgba(0,230,255,0.18), transparent 60%);
  mix-blend-mode: screen;
`

export default function AboutUs() {
  const visualRef = useRef(null)
  const imgRef = useRef(null)
  const rotRef = useRef({ x: 0, y: 0 })

  // Scroll-based parallax
  useEffect(() => {
    function onScroll() {
      if (!visualRef.current || !imgRef.current) return
      const rect = visualRef.current.getBoundingClientRect()
      const viewportH = window.innerHeight || 1
      // progress -1 (far above) to 1 (far below), 0 when centered
      const centerOffset = (rect.top + rect.height / 2) - viewportH / 2
      const progress = Math.max(-1, Math.min(1, centerOffset / (viewportH / 2)))
      const ty = progress * -12 // translateY up/down subtly
      imgRef.current.style.setProperty('--parallax', ty + 'px')
      // re-apply rotation portion to preserve hover tilt
      const { x, y } = rotRef.current
      imgRef.current.style.transform = `translateZ(0) translateY(${ty}px) rotateX(${x}deg) rotateY(${y}deg) scale(1.02)`
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function onMove(e) {
    if (!visualRef.current || !imgRef.current) return
    const rect = visualRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / rect.width
    const dy = (e.clientY - cy) / rect.height
    const rotY = dx * 8 // rotate around Y with horizontal mouse
    const rotX = -dy * 6 // rotate around X with vertical mouse
    rotRef.current = { x: rotX, y: rotY }
    const ty = getComputedStyle(imgRef.current).getPropertyValue('--parallax') || '0px'
    imgRef.current.style.transform = `translateZ(0) translateY(${ty}) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`
  }
  function onLeave() {
    if (imgRef.current) {
      rotRef.current = { x: 0, y: 0 }
      const ty = getComputedStyle(imgRef.current).getPropertyValue('--parallax') || '0px'
      imgRef.current.style.transform = `translateZ(0) translateY(${ty}) rotateX(0) rotateY(0) scale(1)`
    }
  }

  return (
    <Section aria-label="About Us">
      <Grid>
        <VisualWrap ref={visualRef} onMouseMove={onMove} onMouseLeave={onLeave} aria-label="Futuristic robot visual">
          <ImageLayer ref={imgRef} />
          <OverlayGlow />
        </VisualWrap>

        <Content>
          <Title>ABOUT US</Title>
          <SubTitle>	The AI Foundation for Unstuck Development.</SubTitle>
          <Body>
          Getting stuck trying to understand code is a common problem for every developer. CodeSense is a smart tool designed to solve this frustration. We are a collective of innovators and engineers driven to integrate advanced AI to provide instant, clear breakdowns of any code, helping developers learn faster and write better code. Our mission is to transform how you interact with complex programming by providing intuitive explanations and best practices, empowering you to focus on building, not getting stuck.
          </Body>

          {/* Bullets removed by request */}

          {/* CTA removed by request */}
        </Content>
      </Grid>
    </Section>
  )
}
