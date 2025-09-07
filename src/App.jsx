import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function getCorrectIndex(q) {
  if (typeof q.answer === "number") return q.answer;
  if (typeof q.answer === "string") {
    const s = q.answer.trim().toUpperCase();
    const letters = "ABCD";
    if (letters.includes(s)) return letters.indexOf(s);
    const idx = q.options.findIndex(
      (o) => o.trim().toLowerCase() === s.trim().toLowerCase()
    );
    if (idx !== -1) return idx;
  }
  return null;
}

export default function App() {
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const fetchQuestions = async () => {
    if (!topic.trim()) return setError("Please enter a topic");
    setError("");
    setLoading(true);
    setScore(null);
    setSubmitted(false);
    setQuestions([]);
    setAnswers({});

    try {
      const res = await axios.post(`${API_URL}/api/generate`, { topic });
      setQuestions(res.data.questions);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch quiz. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = (qIndex, opt) => {
    if (!submitted) setAnswers({ ...answers, [qIndex]: opt });
  };

  const submitAnswers = (e) => {
    e.preventDefault();
    let sc = 0;
    questions.forEach((q, i) => {
      const chosen = answers[i];
      const correctIdx = getCorrectIndex(q);
      if (correctIdx === null) return;
      if (typeof chosen === "string") {
        if (
          q.options[correctIdx].trim().toLowerCase() ===
          chosen.trim().toLowerCase()
        )
          sc++;
      } else if (typeof chosen === "number") {
        if (chosen === correctIdx) sc++;
      }
    });
    setScore(sc);
    setSubmitted(true);
  };

  const retryQuiz = () => {
    setQuestions([]);
    setAnswers({});
    setScore(null);
    setSubmitted(false);
    setTopic("");
    setError("");
  };

  return (
    <div className="app-container">
      {/* Main Header */}
      <h1 className="app-title">AI Quiz Generator</h1>

      {/* Input Card */}
      <div className="input-card">
        <input
          type="text"
          placeholder="Enter a topic (e.g., Solar System)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button onClick={fetchQuestions} disabled={loading} className="btn">
          {loading ? "Generating…" : "Generate Quiz"}
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Quiz Questions */}
      {questions.length > 0 && (
        <form onSubmit={submitAnswers} className="quiz-form">
          {questions.map((q, i) => {
            const correctIdx = getCorrectIndex(q);
            return (
              <div key={i} className="quiz-card">
                <div className="quiz-question">
                  {i + 1}. {q.question}
                </div>
                <div>
                  {q.options.map((opt, j) => {
                    const isSelected = answers[i] === opt;
                    const isCorrect = correctIdx === j;
                    let extraClass = "";
                    if (submitted) {
                      if (isCorrect) extraClass = " correct";
                      else if (isSelected && !isCorrect) extraClass = " wrong";
                    } else if (isSelected) {
                      extraClass = " selected";
                    }
                    return (
                      <label key={j} className={`option-label${extraClass}`}>
                        <div>
                          <input
                            type="radio"
                            name={`q${i}`}
                            checked={isSelected}
                            disabled={submitted}
                            onChange={() => handleChoice(i, opt)}
                          />
                          <span>{opt}</span>
                        </div>
                        {submitted && isCorrect && <span>✔</span>}
                        {submitted && isSelected && !isCorrect && <span>✖</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {!submitted ? (
            <button type="submit" className="btn submit-btn">
              Submit Answers
            </button>
          ) : (
            <button type="button" onClick={retryQuiz} className="btn retry-btn">
              Retry Quiz
            </button>
          )}
        </form>
      )}

      {/* Score */}
      {score !== null && (
        <div className="score">
          Your score: {score} / {questions.length}
        </div>
      )}
    </div>
  );
}
