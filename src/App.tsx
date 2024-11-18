import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import AdaptiveThresholdingDemo from './components/AdaptiveThresholdingDemo'
import MorphologicalDemo from './components/MorphologicalDemo'
import MorphologicalOps from './components/MorphologicalOps'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <MorphologicalOps/>
      <AdaptiveThresholdingDemo/>
      <MorphologicalDemo/>
    </>
  )
}

export default App
