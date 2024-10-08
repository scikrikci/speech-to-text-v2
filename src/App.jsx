import { useState, useEffect } from "react";
import {
  FaMicrophone,
  FaStop,
  FaCopy,
  FaTrash,
  FaExchangeAlt,
} from "react-icons/fa";
import "./App.scss";

const App = () => {
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("tr");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [translatedText, setTranslatedText] = useState("");
  const [error, setError] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "ja", name: "Japanese" },
    { code: "tr", name: "Turkce" },
  ];

  useEffect(() => {
    let recognition = null;

    if ("webkitSpeechRecognition" in window) {
      recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");
        setText(transcript);
        setError("");
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error === "network") {
          setError(
            "Network error. Please check your internet connection and try again."
          );
        } else {
          setError(
            `Speech recognition error: ${event.error}. Please try again.`
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    }

    if (isListening) {
      recognition.start();
    } else {
      recognition?.stop();
    }

    return () => {
      recognition?.stop();
    };
  }, [isListening, selectedLanguage]);

  useEffect(() => {
    if (text) {
      const debounceTimer = setTimeout(() => {
        handleTranslate();
      }, 500);

      return () => clearTimeout(debounceTimer);
    } else {
      setTranslatedText("");
    }
  }, [text, selectedLanguage, targetLanguage]);

  const handleStartListening = () => {
    setText("");
    setTranslatedText("");
    setError("");
    setIsListening(true);
  };

  const handleStopListening = () => {
    setIsListening(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText || text);
  };

  const handleClear = () => {
    setText("");
    setTranslatedText("");
    setError("");
  };

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
  };

  const handleTargetLanguageChange = (e) => {
    setTargetLanguage(e.target.value);
  };

  const handleTranslate = async () => {
    if (!text || selectedLanguage === targetLanguage) {
      setTranslatedText(text);
      return;
    }

    setIsTranslating(true);
    setError("");

    try {
      const encodedText = encodeURIComponent(text);
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${selectedLanguage}|${targetLanguage}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.responseStatus === 200) {
        setTranslatedText(data.responseData.translatedText);
      } else {
        throw new Error(
          data.responseDetails || "Translation failed. Please try again."
        );
      }
    } catch (error) {
      console.error("Translation error:", error);
      setError(
        "Translation failed. Please check your internet connection and try again. If the problem persists, the translation service might be temporarily unavailable."
      );
      setTranslatedText(""); // Clear any previous translation
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwapLanguages = () => {
    const temp = selectedLanguage;
    setSelectedLanguage(targetLanguage);
    setTargetLanguage(temp);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    setError("");
  };

  return (
    <div className="app">
      <h1 className="title">Instant Speech to Text Translator</h1>
      <div className="controls">
        <button
          onClick={isListening ? handleStopListening : handleStartListening}
        >
          {isListening ? <FaStop /> : <FaMicrophone />}
          {isListening ? "Stop" : "Start"}
        </button>
        <button onClick={handleCopy} disabled={!text && !translatedText}>
          <FaCopy /> Copy
        </button>
        <button
          onClick={handleClear}
          disabled={!text && !translatedText && !error}
        >
          <FaTrash /> Clear
        </button>
      </div>
      <div className="language-select">
        <div className="language-pair">
          <div>
            {/* <label htmlFor="sourceLanguage"></label> */}
            <select
              id="sourceLanguage"
              value={selectedLanguage}
              onChange={handleLanguageChange}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleSwapLanguages} className="swap-button">
            <FaExchangeAlt />
          </button>
          <div>
            {/* <label htmlFor="targetLanguage"></label> */}
            <select
              id="targetLanguage"
              value={targetLanguage}
              onChange={handleTargetLanguageChange}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      {isTranslating && (
        <div className="translating-message">Translating...</div>
      )}

      <div className="word-container">
        <div className="text-area">
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Start speaking or type here..."
          />
        </div>
        <div className="translated-text">
          <p>{translatedText}</p>
        </div>
      </div>
    </div>
  );
};

export default App;
