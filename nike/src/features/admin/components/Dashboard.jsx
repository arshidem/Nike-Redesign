import React from 'react'
import { OrderAnalytics } from './OrderAnalytics'
import ProductAnalytics from './ProductAnalytics'

export const Dashboard = () => {
  return (
    <div className="design-component design-dashboard">
      <header className="console-masthead">
        <div><p className="store-eyebrow">NIKE / STUDIO CONSOLE</p><h1>YOUR BUSINESS.<br /><span>IN MOTION.</span></h1></div>
        <div><span className="console-masthead-mark" aria-hidden="true">↗</span><p>Orders, products, and performance.<br />Your store at a glance.</p></div>
      </header>
      <OrderAnalytics/>
<ProductAnalytics/>
    </div>

  )
}
