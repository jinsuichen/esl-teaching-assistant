import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize the GoogleGenAI client outside the component
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DEFAULT_SUGGESTED_KEYWORDS = ["Travel", "Food", "Hobbies", "Technology", "Culture", "Work", "Education", "Movies", "Music", "Sports", "Health", "Environment"];

const App = () => {
    const [currentPage, setCurrentPage] = useState('main'); // 'main' or 'topicGenerator'

    const features = [
        {
            id: 1,
            title: "Topic Generator",
            description: "Generate discussion topics for ESL lessons.",
            icon: "💡",
            page: 'topicGenerator'
        },
        {
            id: 5, // Original ID preserved for consistency if ever needed
            title: "Role-Play Hub",
            description: "Simulate real-life conversations for practice.",
            icon: "🎭",
            // No page property means it's a placeholder
        },
        {
            id: 6, // Original ID preserved
            title: "Story Creator",
            description: "Weave stories to practice narrative skills.",
            icon: "📖",
            // No page property means it's a placeholder
        }
    ];

    const handleFeatureClick = (feature) => {
        // Only navigate if the feature has a 'page' property
        if (feature.page) {
            setCurrentPage(feature.page);
        }
        // Otherwise, do nothing for placeholder features
    };

    const navigateToMain = () => {
        setCurrentPage('main');
    };

    const MainFeaturesPage = () => (
        <>
            <header className="app-header">
                <h1>ESL Teaching Assistant</h1>
                <p className="app-subtitle">Your AI-powered partner for English language education.</p>
            </header>
            <main className="features-grid" aria-label="Available Features">
                {features.map(feature => (
                    <div
                        key={feature.id}
                        className="feature-card"
                        onClick={() => handleFeatureClick(feature)} // Pass the whole feature object
                        onKeyPress={(e) => e.key === 'Enter' && handleFeatureClick(feature)} // Pass the whole feature object
                        tabIndex={0}
                        role="button"
                        aria-labelledby={`feature-title-${feature.id}`}
                        aria-describedby={`feature-description-${feature.id}`}
                        // Add aria-disabled if the feature is a placeholder without a page
                        aria-disabled={!feature.page ? 'true' : undefined}
                    >
                        <div className="feature-card-icon">{feature.icon}</div>
                        <h2 id={`feature-title-${feature.id}`} className="feature-card-title">{feature.title}</h2>
                        <p id={`feature-description-${feature.id}`} className="feature-card-description">{feature.description}</p>
                    </div>
                ))}
            </main>
            <footer className="app-footer">
                <p>&copy; 2024 ESL Teaching Assistant. All rights reserved.</p>
            </footer>
        </>
    );

    return (
        <div className="app-container">
            {currentPage === 'main' && <MainFeaturesPage />}
            {currentPage === 'topicGenerator' && <TopicGeneratorPage onBack={navigateToMain} />}
        </div>
    );
};

const TopicGeneratorPage = ({ onBack }) => {
    const [keyword, setKeyword] = useState('');
    const [generatedTopics, setGeneratedTopics] = useState([]);
    const [suggestedKeywords, setSuggestedKeywords] = useState([...DEFAULT_SUGGESTED_KEYWORDS]);
    const [allSeenKeywords, setAllSeenKeywords] = useState(new Set(DEFAULT_SUGGESTED_KEYWORDS));

    const [isLoadingTopics, setIsLoadingTopics] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [error, setError] = useState('');

    const [selectedTopicForModal, setSelectedTopicForModal] = useState(null);
    const [modalAuxiliarySentences, setModalAuxiliarySentences] = useState([]);
    const [isLoadingModalContent, setIsLoadingModalContent] = useState(false);
    const [modalError, setModalError] = useState('');

    const parseJsonResponse = (responseText, context = "data") => {
        let jsonStr = responseText.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        try {
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error(`Failed to parse JSON response for ${context}:`, e, "Raw text:", responseText);
            throw new Error(`The AI returned an unexpected format for ${context}. Please try again.`);
        }
    };

    const handleGenerateTopics = async () => {
        if (!keyword.trim()) {
            setError("Please enter a keyword to generate topics.");
            setGeneratedTopics([]); // Clear previous topics if keyword is cleared
            return;
        }
        setIsLoadingTopics(true);
        setError('');
        setGeneratedTopics([]);

        try {
            const prompt = `You are an ESL teaching assistant. Generate exactly 5 engaging discussion topics for ESL students based on the keyword: "${keyword}". Return the topics as a JSON array of strings. For example: ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]`;
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-04-17",
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });

            const topicsArray = parseJsonResponse(response.text, "topics");
            if (Array.isArray(topicsArray) && topicsArray.every(item => typeof item === 'string')) {
                setGeneratedTopics(topicsArray.slice(0, 5));
            } else {
                throw new Error("AI response was not a valid list of topics.");
            }
        } catch (err) {
            console.error("Error generating topics:", err);
            setError(err.message || "Failed to generate topics. Please check your connection or API key and try again.");
            setGeneratedTopics([]);
        } finally {
            setIsLoadingTopics(false);
        }
    };

    const fetchSuggestedKeywordsFromAI = useCallback(async () => {
        setIsLoadingSuggestions(true);
        setError(''); // Clear general error, specific errors handled locally if needed
        try {
            const keywordsToAvoid = Array.from(allSeenKeywords).join(', ');
            const prompt = `You are an ESL teaching assistant. Generate 7 diverse and common keywords suitable for ESL discussion topics. Avoid generating any of these keywords: [${keywordsToAvoid}]. If you cannot generate 7 new keywords, generate as many new ones as you can. The keywords should be single words or very short phrases. Return the keywords as a JSON array of strings. For example: ["Travel", "Food", "Hobbies"]`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-04-17",
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            const newKeywordsArray = parseJsonResponse(response.text, "suggested keywords");

            if (Array.isArray(newKeywordsArray) && newKeywordsArray.every(item => typeof item === 'string')) {
                setSuggestedKeywords(newKeywordsArray);
                setAllSeenKeywords(prev => new Set([...prev, ...newKeywordsArray]));
            } else {
                throw new Error("AI response was not a valid list of keywords.");
            }
        } catch (err)
 {
            console.error("Error fetching suggested keywords:", err);
            // Update a specific error state for suggestions if you add one, or use general error
            setError(err.message || "Failed to fetch suggestions. Please try again.");
        } finally {
            setIsLoadingSuggestions(false);
        }
    }, [allSeenKeywords]);

    const handleSuggestedKeywordClick = (suggestedKeyword) => {
        setKeyword(suggestedKeyword);
        // Optionally auto-generate topics when a suggestion is clicked
        // For now, let's require explicit click on "Generate Topics"
        // handleGenerateTopics();
    };

    const handleTopicCardClick = async (topic) => {
        setSelectedTopicForModal(topic);
        setIsLoadingModalContent(true);
        setModalAuxiliarySentences([]);
        setModalError('');

        try {
            const prompt = `You are an ESL teaching assistant. For the discussion topic "${topic}", generate 5 to 8 short, simple auxiliary sentences to help an ESL student discuss this topic. These can be simple statements or questions. Return them as a JSON array of strings. For example: ["What do you think about...?", "I believe that...", "Have you ever...?"]`;
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-04-17",
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            const sentencesArray = parseJsonResponse(response.text, "auxiliary sentences");
            if (Array.isArray(sentencesArray) && sentencesArray.every(item => typeof item === 'string')) {
                setModalAuxiliarySentences(sentencesArray);
            } else {
                throw new Error("AI response was not a valid list of auxiliary sentences.");
            }
        } catch (err) {
            console.error("Error fetching auxiliary sentences:", err);
            setModalError(err.message || "Failed to fetch auxiliary sentences. Please try again.");
        } finally {
            setIsLoadingModalContent(false);
        }
    };

    const closeModal = () => {
        setSelectedTopicForModal(null);
    };


    return (
        <div className="topic-generator-page">
            <button onClick={onBack} className="back-button" aria-label="Go back to main features">
                &larr; Back
            </button>
            <h2 className="page-title">ESL Topic Generator</h2>

            <div className="input-area">
                <label htmlFor="keywordInput" className="sr-only">Enter Keyword</label>
                <input
                    id="keywordInput"
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGenerateTopics()}
                    placeholder="Enter a keyword (e.g., travel, food)"
                    aria-describedby="keyword-help"
                />
                <button onClick={handleGenerateTopics} disabled={isLoadingTopics || !keyword.trim()}>
                    {isLoadingTopics ? "Generating..." : "Generate Topics"}
                </button>
                <p id="keyword-help" className="sr-only">Type a word or phrase related to the topics you want to discuss.</p>
            </div>

            {error && <p className="error-message" role="alert">{error}</p>}

            <div className="suggestions-area">
                <div className="suggestions-header">
                    <h3>Suggested Keywords</h3>
                    <button
                        onClick={fetchSuggestedKeywordsFromAI}
                        disabled={isLoadingSuggestions}
                        className="refresh-suggestions-button"
                        aria-label="Refresh suggested keywords from AI"
                    >
                        {isLoadingSuggestions ? "⏳" : "🔄"}
                    </button>
                </div>

                {/* Show loading message for suggestions only if suggestions array is empty, to avoid layout shift if old suggestions are present */}
                {isLoadingSuggestions && suggestedKeywords.length === 0 && <p className="loading-message">Loading suggestions...</p>}

                {!isLoadingSuggestions && suggestedKeywords.length === 0 && !error && (
                    <p>No new suggestions available at the moment. Try a different keyword or refresh later.</p>
                )}

                {suggestedKeywords.length > 0 && (
                    <div className="keywords-list" role="listbox" aria-label="Suggested keywords">
                        {suggestedKeywords.map((kw, index) => (
                            <button
                                key={index}
                                className="keyword-chip"
                                onClick={() => handleSuggestedKeywordClick(kw)}
                                role="option"
                                aria-selected={keyword === kw}
                            >
                                {kw}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {isLoadingTopics && <p className="loading-message">Generating topics, please wait...</p>}

            {generatedTopics.length > 0 && (
                <div className="results-area" aria-live="polite">
                    <h3 id="generated-topics-heading">Generated Topics:</h3>
                    <div className="topic-cards-container" aria-labelledby="generated-topics-heading">
                        {generatedTopics.map((topic, index) => (
                            <button
                                key={index}
                                className="topic-card"
                                onClick={() => handleTopicCardClick(topic)}
                                aria-label={`View details for topic: ${topic}`}
                            >
                                {topic}
                            </button>
                        ))}
                    </div>
                </div>
            )}


            {selectedTopicForModal && (
                <div className="modal-overlay" onClick={closeModal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 id="modal-title" className="modal-title-text">{selectedTopicForModal}</h3>
                            <button onClick={closeModal} className="modal-close-button" aria-label="Close topic details">&times;</button>
                        </div>
                        {isLoadingModalContent && <p className="loading-message">Loading suggestions...</p>}
                        {modalError && <p className="error-message" role="alert">{modalError}</p>}
                        {!isLoadingModalContent && !modalError && modalAuxiliarySentences.length > 0 && (
                            <ul className="auxiliary-sentences-list">
                                {modalAuxiliarySentences.map((sentence, index) => (
                                    <li key={index}>{sentence}</li>
                                ))}
                            </ul>
                        )}
                        {!isLoadingModalContent && !modalError && modalAuxiliarySentences.length === 0 && (
                            <p>No specific suggestions available for this topic.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
} else {
    console.error('Failed to find the root element');
}