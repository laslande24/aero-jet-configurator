import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'

interface GltfJetProps {
  url: string
}

/**
 * Real aircraft model — used when an Aircraft entry sets `modelUrl`
 * (drop the .glb in /public/models). Draco-compressed files are decoded
 * with the local decoder in /public/draco (no CDN fetch). Suspends while
 * loading; a load failure is caught by <ModelBoundary> which falls back
 * to the procedural jet.
 */
export function GltfJet({ url }: GltfJetProps) {
  const { scene } = useGLTF(url, '/draco/')
  // Clone so two aircraft sharing a file never fight over the same graph.
  const instance = useMemo(() => scene.clone(true), [scene])
  return <primitive object={instance} />
}
