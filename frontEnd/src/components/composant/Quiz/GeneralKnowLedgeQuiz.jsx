import { useState, useEffect } from "react";

export const GeneralKnowledgeQuiz = ({ data }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const currentLevelData = data?.levels?.[0] || { questions: [], name: "" };
  const questions = Array.isArray(currentLevelData.questions) ? currentLevelData.questions : [];

  // reset local state si questions change
  useEffect(() => {
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setSelectedAnswer(null);
    setShowFeedback(false);
  }, [data]);

  // Pas de questions -> message amiable (évite crash)
  if (!questions.length) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium mb-2">{data?.title || "Quiz Général"}</h3>
        <p className="text-gray-600">Aucune question disponible pour ce niveau pour le moment.</p>
      </div>
    );
  }

  const q = questions[currentQuestion];

  const handleAnswerClick = (optionIndex) => {
    if (showFeedback) return;
    setSelectedAnswer(optionIndex);
    setShowFeedback(true);
    if (optionIndex === q.correctAnswer) setScore(prev => prev + 1);

    setTimeout(() => {
      const next = currentQuestion + 1;
      if (next < questions.length) {
        setCurrentQuestion(next);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        setShowScore(true);
      }
    }, 1800); // délai avant la question suivante
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  if (showScore) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Quiz Terminé !</h3>
        <p className="text-lg mb-6">Votre score: {score} / {questions.length}</p>
        <button onClick={resetQuiz} className="px-6 py-3 bg-blue-600 text-white rounded-lg">Rejouer</button>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{data.title}</h3>
      <p className="text-gray-600 mb-4">{data.description}</p>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-blue-600">Question {currentQuestion + 1} / {questions.length}</span>
          <span className="text-sm font-medium text-gray-600">Score: {score}</span>
        </div>

        <h4 className="text-lg font-medium text-gray-800 mb-4">{q.question}</h4>

        <div className="space-y-3">
          {q.options.map((opt, i) => {
            const isSelected = selectedAnswer === i;
            const isCorrect = q.correctAnswer === i;
            const baseCls = "w-full text-left p-4 rounded-lg border transition";
            const cls = isSelected
              ? (isCorrect ? `${baseCls} bg-green-100 border-green-500` : `${baseCls} bg-red-100 border-red-500`)
              : `${baseCls} bg-gray-50 border-gray-200 hover:bg-blue-50`;

            return (
              <button key={i} className={cls} onClick={() => handleAnswerClick(i)} disabled={showFeedback}>
                {opt}
              </button>
            );
          })}
        </div>

        {showFeedback && (
          <div className={`mt-4 p-4 rounded-lg ${selectedAnswer === q.correctAnswer ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            <p className="font-medium">{selectedAnswer === q.correctAnswer ? "Correct! ✓" : "Incorrect! ✗"}</p>
            <p className="mt-2">{q.explanation ?? `La bonne réponse est ${q.options[q.correctAnswer]}.`}</p>
          </div>
        )}
      </div>
    </div>
  );
};
