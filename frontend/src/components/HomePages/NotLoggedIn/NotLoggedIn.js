import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar/Navbar";
import './NotLoggedIn.css';

const phrases = [
  "AI Builds Your Syllabus",
  "Instant Course Creator",
  "Smart. Fast. Structured.",
];

function NotLoggedIn() {
  const [text, setText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pause, setPause] = useState(false);

  useEffect(() => {
    if (pause) {
      // Pause for 800ms before deleting or moving on
      const pauseTimeout = setTimeout(() => setPause(false), 800);
      return () => clearTimeout(pauseTimeout);
    }

    const currentPhrase = phrases[phraseIndex];
    const speed = isDeleting ? 25 : 50;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing forward
        const nextText = currentPhrase.slice(0, charIndex + 1);
        setText(nextText);
        setCharIndex(charIndex + 1);

        if (nextText === currentPhrase) {
          // Pause at full phrase before deleting
          setPause(true);
          setIsDeleting(true);
        }
      } else {
        // Deleting
        const nextText = currentPhrase.slice(0, charIndex - 1);
        setText(nextText);
        setCharIndex(charIndex - 1);

        if (nextText === "") {
          // Pause before next phrase typing
          setPause(true);
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, phraseIndex, pause]);

  return (
    <motion.div
      className="home-page"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      <Navbar />
      <div className="hero">
        <h2 className="typing-text">
          {text}
          <span className="cursor">|</span>
        </h2>
        <p>Let AI generate comprehensive course content for you in seconds.</p>
        <div className="animated-image"></div>
      </div>
      <footer className="footer">
        <p>Made with ❤️ by Ajayendra</p>
      </footer>
    </motion.div>
  );
}

export default NotLoggedIn;
