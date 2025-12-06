// ------------------------------
// Backend endpoints
// ------------------------------

// For local dev:
//const API_ASK_URL = "http://localhost:8000/ask";
//const API_RESET_URL = "http://localhost:8000/reset";

// If you expose via ngrok, just replace the base URL above, e.g.:
const API_ASK_URL   = "https://nonnegligible-dovelike-emiko.ngrok-free.dev/ask";
const API_RESET_URL = "https://nonnegligible-dovelike-emiko.ngrok-free.dev/reset";


// ------------------------------
// Session handling (for middle LLM history)
// ------------------------------
//
// We want a stable session_id so the backend can maintain a question
// history for the middle LLM. Use localStorage so the ID survives
// page reloads until "Reset conversation" is pressed.

const SESSION_STORAGE_KEY = "scd_rag_session_id";

let SESSION_ID = localStorage.getItem(SESSION_STORAGE_KEY);

if (!SESSION_ID) {
  SESSION_ID =
    (crypto.randomUUID && crypto.randomUUID()) ||
    "sess-" + Math.random().toString(36).slice(2);
  localStorage.setItem(SESSION_STORAGE_KEY, SESSION_ID);
}

// ------------------------------
// DOM elements
// ------------------------------

const questionInput = document.getElementById("question");
const askButton = document.getElementById("ask-btn");
const resetButton = document.getElementById("reset-btn");
const statusDiv = document.getElementById("status");
const answerDiv = document.getElementById("answer");
const rewrittenDiv = document.getElementById("rewritten-question");


// ------------------------------
// Ask endpoint
// ------------------------------

async function askQuestion() {
  const question = questionInput.value.trim();
  if (!question) {
    statusDiv.textContent = "Please enter a question.";
    return;
  }

  statusDiv.textContent = "Sending question to SCD RAG assistant...";
  // Do NOT clear previous conversation in answerDiv; we want full history
  rewrittenDiv.textContent = "";

  askButton.disabled = true;
  resetButton.disabled = true;
  askButton.textContent = "Thinking...";

  try {
    const response = await fetch(API_ASK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // IMPORTANT: send session_id so backend can use question history
      body: JSON.stringify({ question, session_id: SESSION_ID }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();

    const answer = data.answer || "No answer returned.";
    const rewritten = data.rewritten_question || question;

    // Show rewritten question (for debugging / transparency)
    rewrittenDiv.textContent = rewritten;

    // Build the new Q+A block
    const newBlock =
      `Question:\n${question}\n\n` +
      `Answer:\n${answer}\n`;

    // Append to existing conversation instead of overwriting
    const previous = answerDiv.textContent.trim();
    if (previous) {
      answerDiv.textContent = previous + "\n\n------------------------------\n\n" + newBlock;
    } else {
      answerDiv.textContent = newBlock;
    }

    statusDiv.textContent = "Done.";
  } catch (err) {
    console.error(err);
    statusDiv.textContent = "Error: Could not get response. Check console/logs.";
  } finally {
    // Clear input AFTER response arrives, so user sees what they typed
    questionInput.value = "";
    askButton.disabled = false;
    resetButton.disabled = false;
    askButton.textContent = "Ask";
  }
}


// ------------------------------
// Reset endpoint
// ------------------------------

async function resetConversation() {
  statusDiv.textContent = "Resetting conversation...";
  answerDiv.textContent = "";
  rewrittenDiv.textContent = "";

  resetButton.disabled = true;
  askButton.disabled = true;

  try {
    const response = await fetch(API_RESET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session_id: SESSION_ID }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error("Reset failed on server");
    }

    statusDiv.textContent = "Conversation reset.";

    // Optional: if you want a brand-new session_id after reset,
    // uncomment this block:
    /*
    SESSION_ID =
      (crypto.randomUUID && crypto.randomUUID()) ||
      "sess-" + Math.random().toString(36).slice(2);
    localStorage.setItem(SESSION_STORAGE_KEY, SESSION_ID);
    */
  } catch (err) {
    console.error(err);
    statusDiv.textContent = "Error: could not reset conversation.";
  } finally {
    resetButton.disabled = false;
    askButton.disabled = false;
  }
}


// ------------------------------
// Event listeners
// ------------------------------

askButton.addEventListener("click", askQuestion);
resetButton.addEventListener("click", resetConversation);

// Optional: submit on Ctrl+Enter / Cmd+Enter
questionInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    askQuestion();
  }
});



