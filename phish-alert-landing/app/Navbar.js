// Navbar.js
import styles from './styles/Navbar.module.css'
import Image from 'next/image'
import HorizontalIcon from './logos/horizontal.png'

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logoContainer}>
        <Image src={HorizontalIcon} alt="Logo" className={styles.logo} />
      </div>
      <div className={styles.navLinks}>
        <a href="#features">Features</a>
        <a href="#cta">Get the Extension</a>
        <a href="https://github.com">GitHub</a>
      </div>
    </nav>
  )
}
