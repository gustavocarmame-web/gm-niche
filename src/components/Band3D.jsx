import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Float, Lightformer, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

function makeKnitTexture() {
  const size = 256
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, size, size)
  const cell = 8
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const dir = ((x / cell + y / cell) % 2 === 0) ? 1 : -1
      ctx.lineWidth = 2.2
      ctx.strokeStyle = 'rgba(255,255,255,0.42)'
      ctx.beginPath()
      ctx.moveTo(x, dir > 0 ? y : y + cell)
      ctx.lineTo(x + cell, dir > 0 ? y + cell : y)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(0,0,0,0.42)'
      ctx.beginPath()
      ctx.moveTo(x + 3, dir > 0 ? y : y + cell)
      ctx.lineTo(x + cell + 3, dir > 0 ? y + cell : y)
      ctx.stroke()
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(46, 4)
  tex.anisotropy = 8
  return tex
}

// Keeps the whole band in view whatever the aspect ratio of the container.
function FitCamera({ distance }) {
  const { camera, size } = useThree()
  useEffect(() => {
    const aspect = size.width / size.height
    camera.position.z = distance * Math.max(1, 1.3 / aspect)
    camera.updateProjectionMatrix()
  }, [camera, size, distance])
  return null
}

function Band({ color, clasp, spin = 0.12, follow = true, scrollRef, sway = 0 }) {
  const group = useRef()
  const strapMat = useRef()
  const claspMat = useRef()
  const knit = useMemo(makeKnitTexture, [])
  const targetColor = useMemo(() => new THREE.Color(color), [color])
  const targetClasp = useMemo(() => new THREE.Color(clasp), [clasp])
  const base = useMemo(() => new THREE.Euler(0.55, -0.6, 0.08), [])

  useFrame((state, dt) => {
    const g = group.current
    if (!g) return
    const p = follow ? state.pointer : { x: 0, y: 0 }
    const scroll = scrollRef?.current ?? 0
    const tx = base.x - p.y * 0.25
    const t = state.clock.elapsedTime
    const ty = base.y + p.x * 0.45 + t * spin + Math.sin(t * 0.5) * sway + scroll * Math.PI
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, tx, 4, dt)
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, ty, 4, dt)
    if (strapMat.current) strapMat.current.color.lerp(targetColor, 1 - Math.exp(-6 * dt))
    if (claspMat.current) claspMat.current.color.lerp(targetClasp, 1 - Math.exp(-6 * dt))
  })

  return (
    <group ref={group}>
      {/* Strap: a flattened, slightly elliptical torus */}
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.12, 1, 3.1]} castShadow>
        <torusGeometry args={[1, 0.052, 28, 180]} />
        <meshStandardMaterial
          ref={strapMat}
          color={color}
          roughness={0.82}
          metalness={0.04}
          bumpMap={knit}
          bumpScale={2.2}
        />
      </mesh>

      {/* Sensor unit on the front */}
      <group position={[0, -0.02, 1.1]}>
        <RoundedBox args={[0.66, 0.36, 0.17]} radius={0.06} smoothness={6} castShadow>
          <meshStandardMaterial color="#111214" roughness={0.38} metalness={0.25} />
        </RoundedBox>
        <mesh position={[-0.22, 0, 0.09]}>
          <sphereGeometry args={[0.014, 12, 12]} />
          <meshStandardMaterial color="#4CAF7D" emissive="#4CAF7D" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0, 0, 0.088]}>
          <planeGeometry args={[0.5, 0.22]} />
          <meshStandardMaterial color="#1A1B1E" roughness={0.2} metalness={0.4} />
        </mesh>
      </group>

      {/* Clasp on the back */}
      <group position={[0, 0.0, -1.06]} rotation={[0, Math.PI, 0]}>
        <RoundedBox args={[0.26, 0.4, 0.09]} radius={0.03} smoothness={5}>
          <meshStandardMaterial ref={claspMat} color={clasp} roughness={0.22} metalness={1} />
        </RoundedBox>
        <RoundedBox args={[0.1, 0.42, 0.11]} radius={0.03} smoothness={5} position={[0.32, 0, 0]}>
          <meshStandardMaterial color={clasp} roughness={0.25} metalness={1} />
        </RoundedBox>
      </group>
    </group>
  )
}

export default function Band3D({ color, clasp, className, spin = 0, sway = 0.35, follow, scrollRef, float = true, shadow = true, distance = 3.7 }) {
  return (
    <div className={className}>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.15, distance], fov: 34 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        shadows
      >
        <FitCamera distance={distance} />
        <ambientLight intensity={0.3} />
        <directionalLight position={[3, 5, 4]} intensity={1.6} castShadow />
        <directionalLight position={[-4, 2, -3]} intensity={0.6} />
        {/* Rim light: separates a dark band from the light background */}
        <directionalLight position={[-2, 3, -5]} intensity={2.2} color="#ffffff" />
        <Suspense fallback={null}>
          {/* Procedural studio lighting: no network fetch, loads instantly */}
          <Environment resolution={256} environmentIntensity={0.9}>
            <Lightformer form="rect" intensity={3} position={[0, 4, 2]} scale={[6, 3, 1]} target={[0, 0, 0]} color="#fff8ee" />
            <Lightformer form="rect" intensity={1.6} position={[-5, 1.5, 2]} scale={[2, 5, 1]} target={[0, 0, 0]} color="#f2f4ff" />
            <Lightformer form="rect" intensity={1.2} position={[5, 0.5, -1]} scale={[2, 4, 1]} target={[0, 0, 0]} color="#fff3e6" />
            <Lightformer form="ring" intensity={0.8} position={[0, -3, 3]} scale={3} target={[0, 0, 0]} color="#ffffff" />
          </Environment>
        </Suspense>
        {float ? (
          <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.5}>
            <Band color={color} clasp={clasp} spin={spin} sway={sway} follow={follow} scrollRef={scrollRef} />
          </Float>
        ) : (
          <Band color={color} clasp={clasp} spin={spin} sway={sway} follow={follow} scrollRef={scrollRef} />
        )}
        {shadow && (
          <ContactShadows position={[0, -1.35, 0]} opacity={0.35} scale={6} blur={2.6} far={2} color="#2A2822" />
        )}
      </Canvas>
    </div>
  )
}
