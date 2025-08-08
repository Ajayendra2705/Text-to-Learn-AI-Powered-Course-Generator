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

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    const speed = isDeleting ? 30 : 60;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        const nextText = currentPhrase.slice(0, charIndex + 1);
        setText(nextText);
        setCharIndex((prev) => prev + 1);

        if (nextText === currentPhrase) {
          setTimeout(() => setIsDeleting(true), 1200);
        }
      } else {
        const nextText = currentPhrase.slice(0, charIndex - 1);
        setText(nextText);
        setCharIndex((prev) => prev - 1);

        if (nextText === "") {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, phraseIndex]);

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
