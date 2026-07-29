import { Component, type ReactNode } from 'react'

interface ModelBoundaryProps {
  /** Re-arms the boundary when it changes (e.g. the model URL). */
  resetKey: string
  fallback: ReactNode
  children: ReactNode
}

interface ModelBoundaryState {
  failed: boolean
}

/** Error boundary around GLB loading — falls back to the procedural jet. */
export class ModelBoundary extends Component<ModelBoundaryProps, ModelBoundaryState> {
  state: ModelBoundaryState = { failed: false }

  static getDerivedStateFromError(): ModelBoundaryState {
    return { failed: true }
  }

  componentDidUpdate(prev: ModelBoundaryProps) {
    /* Re-arming an error boundary requires a guarded setState here; the extra
       render only happens when the model URL actually changes. */
    if (prev.resetKey !== this.props.resetKey && this.state.failed) {
      // oxlint-disable-next-line react/no-did-update-set-state
      this.setState({ failed: false })
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
