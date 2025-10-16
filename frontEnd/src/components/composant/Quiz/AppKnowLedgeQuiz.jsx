import { useState } from "react";

// Composant pour le quiz sur la connaissance de l'application
export const AppKnowledgeQuiz = ({ data }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleAnswerClick = (optionIndex) => {
    if (showFeedback) return;
    
    setSelectedAnswer(optionIndex);
    setShowFeedback(true);
    
    if (optionIndex === data.questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
    
    setTimeout(() => {
      const nextQuestion = currentQuestion + 1;
      if (nextQuestion < data.questions.length) {
        setCurrentQuestion(nextQuestion);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        setShowScore(true);
      }
    }, 2500);
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
        <p className="text-lg mb-6">Votre score: {score} / {data.questions.length}</p>
        <button 
          onClick={resetQuiz}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Recommencer le quiz
        </button>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{data.title}</h3>
      <p className="text-gray-600 mb-6">{data.description}</p>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-blue-600">
            Question {currentQuestion + 1} sur {data.questions.length}
          </span>
          <span className="text-sm font-medium text-gray-600">Score: {score}</span>
        </div>
        
        <h4 className="text-lg font-medium text-gray-800 mb-4">
          {data.questions[currentQuestion].question}
        </h4>
        
        <div className="space-y-3">
          {data.questions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              className={`w-full text-left p-4 rounded-lg border transition
                ${selectedAnswer === index 
                  ? index === data.questions[currentQuestion].correctAnswer
                    ? 'bg-green-100 border-green-500' 
                    : 'bg-red-100 border-red-500'
                  : 'bg-gray-50 border-gray-200 hover:bg-blue-50'
                }`}
              onClick={() => handleAnswerClick(index)}
            >
              {option}
            </button>
          ))}
        </div>
        
        {showFeedback && (
          <div className={`mt-4 p-4 rounded-lg ${
            selectedAnswer === data.questions[currentQuestion].correctAnswer
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            <p className="font-medium">
              {selectedAnswer === data.questions[currentQuestion].correctAnswer
                ? "Correct! ✓"
                : "Incorrect! ✗"
              }
            </p>
            <p className="mt-2">{data.questions[currentQuestion].explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
};