"use client"

import { useEffect, useRef } from 'react'
import Typed from 'typed.js'
import styles from './styles/Home.module.css'

export default function Home(){
  const typedElement = useRef(null)
  const typedInstance = useRef(null)

  useEffect(() => {
    if(typedElement.current){
      typedInstance.current = new Typed(typedElement.current, {
        strings: [
          'Protect yourself from phishing scams.',
          'Stay secure while browsing.',
          'Detect threats in real-time.',
          'Stay alert and avoid phishing attacks.'
        ],
        typeSpeed: 50,
        backSpeed: 25,
        backDelay: 1500,
        loop: true,
      })
    }

    return () => {
      if(typedInstance.current){
        typedInstance.current.destroy()
      }
    }
  }, [])

  return(
    <div className={styles.container}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.typingContainer}>
            <h1>
              <span ref={typedElement}></span>
            </h1>
          </div>
        </section>

        <section className={styles.features}>
          <div className={styles.cardContainer}>
            <div className={styles.card}>
              <h3>Real-time Scam Detection</h3>
              <p>Our extension identifies phishing scams as they occur to keep you safe.</p>
            </div>
            <div className={styles.card}>
              <h3>Intuitive Warnings</h3>
              <p>Easy-to-understand alerts that guide you away from risky links.</p>
            </div>
            <div className={styles.card}>
              <h3>One-Click Protection</h3>
              <p>Install Phish Alert and stay protected with a single click.</p>
            </div>
          </div>
        </section>

        <section className={styles.cta}>
          <div className={styles.ctaButtons}>
            <a href="https://github.com" className={styles.btn}>GitHub</a>
            <a href="https://extensionpage.com" className={styles.btn}>Get the Extension</a>
          </div>
        </section>
      </main>
    </div>
  )
}