// Change this to your backend URL.
// For local dev: "http://localhost:8000/ask"
// After deploying backend: "https://your-backend-domain.com/ask"
const API_URL = "https://nonnegligible-dovelike-emiko.ngrok-free.dev/ask";

const questionInput = document.getElementById("question");
const askButton = document.getElementById("ask-btn");
const statusDiv = document.getElementById("status");
const answerDiv = document.getElementById("answer");

async function askQuestion() {
  const question = questionInput.value.trim();
  if (!question) {
    statusDiv.textContent = "Please enter a question.";
    return;
  }

  statusDiv.textContent = "Sending question to SCD RAG assistant...";
  answerDiv.textContent = "";

  askButton.disabled = true;
  askButton.textContent = "Thinking...";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    answerDiv.textContent = data.answer || "No answer returned.";
    statusDiv.textContent = "Done.";
  } catch (err) {
    console.error(err);
    statusDiv.textContent = "Error: Could not get response. Check console/logs.";
    answerDiv.textContent = "";
  } finally {
    askButton.disabled = false;
    askButton.textContent = "Ask";
  }
}

askButton.addEventListener("click", askQuestion);

// Optional: submit on Ctrl+Enter
questionInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    askQuestion();
  }
});
