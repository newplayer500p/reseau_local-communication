import React, { useState, useEffect } from "react";
import { api } from "../../../service/axios.service";
import { GeneralKnowledgeQuiz } from "../Quiz/GeneralKnowLedgeQuiz";
import { AppKnowledgeQuiz } from "../Quiz/AppKnowLedgeQuiz";
import fallbackGeneral from "../../../assets/fallbackGeneral.json";

// Données locales pour la section "appKnowledge" (inchangées)
const quizDataLocal = {
  appKnowledge: {
    title: "Connaissances de l'application",
    description:
      "Testez votre compréhension des fonctionnalités de notre application",
    questions: [
      {
        id: 1,
        question: "Quelle est la fonction principale de notre application ?",
        options: [
          "Transfert de fichiers",
          "Messagerie instantanée",
          "Gestion de projets",
          "Réseautage social",
        ],
        correctAnswer: 0,
        explanation:
          "Notre application est principalement conçue pour le transfert sécurisé de fichiers.",
      },
      {
        id: 2,
        question: "Quel format de fichier est supporté pour le transfert ?",
        options: ["PDF", "DOCX", "JPG", "Tous les précédents"],
        correctAnswer: 3,
        explanation: "Tous ces formats sont supportés par notre application.",
      },
      {
        id: 3,
        question:
          "Quelle est la taille maximale des fichiers que vous pouvez transférer dans les message|discussion ?",
        options: ["50 Mo", "100 Mo", "1 Go", "Illimitée"],
        correctAnswer: 2,
        explanation:
          "La taille maximale des fichiers est de 1 Go pour les utilisateurs standard.",
      },
    ],
  },
};

// mapping index -> difficulty param (en français) et affichage
const LEVELS = [
  { name: "Facile", param: "facile" },
  { name: "Moyen", param: "moyen" },
  { name: "Difficile", param: "difficile" },
];

export const QuizSection = () => {
  const [activeTab, setActiveTab] = useState("appKnowledge");
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);

  // état pour les données du quiz général (remplacé par l'API)
  const [generalData, setGeneralData] = useState({
    title: "Quiz Général",
    description: "Testez vos connaissances générales sur divers sujets",
    levels: [
      {
        name: LEVELS[0].name,
        questions: [], // vide initialement ; sera rempli par l'API
      },
    ],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeTab !== "generalKnowledge") return;

    const difficultyParam = LEVELS[currentLevelIndex]?.param || "facile";
    const amount = 10;

    setLoading(true);
    setError(null);

    api
      .get("/api/quiz", { params: { difficulty: difficultyParam, amount } })
      .then((resp) => {
        
        let data = {};

        if (resp.status === 200){
          data = resp.data;
        } else{
          data = {}
        }
        // si data.questions existe et non vide -> normaliser
        if (
          data &&
          Array.isArray(data.questions) &&
          data.questions.length > 0
        ) {
          const normalized = {
            title: "Quiz Général",
            description: "Testez vos connaissances générales sur divers sujets",
            levels: [
              {
                name: data.name || LEVELS[currentLevelIndex].name,
                questions: data.questions,
              },
            ],
          };
          setGeneralData(normalized);
        } else {
          // fallback local si API renvoie vide
          console.warn("API returned empty list, using local fallback.");
          const normalized = {
            title: "Internet indisponible",
            description: "Choix de niveaux impossible",
            levels: [{ name: "Facile", questions: fallbackGeneral.questions }],
          };

          console.log("Fallback")

          setGeneralData(normalized);
        }
      })
      .catch((err) => {
        console.error("fetch quiz error:", err);
        setError(
          "Impossible de charger les questions. Utilisation d'un fallback local."
        );
        // fallback local immédiat
        const normalized = {
          title: "Quiz Général (fallback)",
          description: "Contenu local car API indisponible",
          levels: [{ name: "Facile", questions: fallbackGeneral.questions }],
        };
        setGeneralData(normalized);
      })
      .finally(() => setLoading(false));
  }, [activeTab, currentLevelIndex]);

  const onSelectLevel = (index) => {
    setCurrentLevelIndex(index);
    // si déjà sur generalKnowledge, useEffect déclenchera le fetch
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-center text-blue-600 mb-8">
        Espace Quiz
      </h2>

      {/* Navigation entre les types de quiz */}
      <div className="flex mb-6 border-b border-gray-200">
        <button
          className={`py-3 px-6 font-medium text-lg ${
            activeTab === "appKnowledge"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("appKnowledge")}
        >
          {quizDataLocal.appKnowledge.title}
        </button>
        <button
          className={`py-3 px-6 font-medium text-lg ${
            activeTab === "generalKnowledge"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("generalKnowledge")}
        >
          {generalData.title}
        </button>
      </div>

      {/* Contenu du quiz sélectionné */}
      <div className="quiz-content">
        {activeTab === "appKnowledge" ? (
          <AppKnowledgeQuiz data={quizDataLocal.appKnowledge} />
        ) : (
          <div>
            {/* Choix du niveau */}
            <div className="flex gap-3 mb-4">
              {LEVELS.map((lvl, idx) => (
                <button
                  key={lvl.param}
                  onClick={() => onSelectLevel(idx)}
                  className={`px-3 py-2 rounded-full border ${
                    idx === currentLevelIndex
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-200"
                  } transition`}
                >
                  {lvl.name}
                </button>
              ))}
            </div>

            {/* animation de chargement stylée pendant le fetch */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-10">
                {/* spinner Tailwind */}
                <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-400 border-t-transparent mb-4"></div>
                <div className="text-gray-500">Chargement des questions...</div>
              </div>
            )}

            {/* affichage d'erreur */}
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
                {error}
              </div>
            )}

            {/* contenu une fois chargé */}
            {!loading &&
              !error &&
              generalData.levels[0].questions.length === 0 && (
                <div className="text-gray-500 py-6">
                  Aucune question disponible pour ce niveau.
                </div>
              )}

            {!loading &&
              !error &&
              generalData.levels[0].questions.length > 0 && (
                <GeneralKnowledgeQuiz
                  data={generalData} // format : { title, description, levels: [{ name, questions }] }
                  currentLevelIndex={currentLevelIndex}
                  // si ton GeneralKnowledgeQuiz attend d'autres props, adapte ici
                />
              )}
          </div>
        )}
      </div>
    </div>
  );
};
