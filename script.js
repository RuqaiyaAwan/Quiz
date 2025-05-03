let timerInterval;

function validateLogin() {
    const usernameInput = document.getElementById('username').value.trim().toLowerCase();
    const contactInput = document.getElementById('contact').value.trim();
    const loginError = document.getElementById('login-error');

    if (!usernameInput || !contactInput) {
        loginError.textContent = "Please fill all fields.";
        return;
    }

    // Sign in anonymously
    firebase.auth().signInAnonymously()
        .then(() => {
            // Query registered users from Firestore
            return firebase.firestore()
                .collection("registeredUsers")
                .where("name", "==", usernameInput)
                .where("contact", "==", contactInput)
                .get();
        })
        .then(snapshot => {
            if (snapshot.empty) {
                loginError.textContent = "Invalid name or contact.";
                return;
            }

            const userDoc = snapshot.docs[0];
            const matchedUser = userDoc.data();
            const userId = userDoc.id;

            // Store current user session
            sessionStorage.setItem('currentUser', JSON.stringify({
                id: userId,
                name: matchedUser.name,
                contact: matchedUser.contact
            }));

            // Get current test ID
            return firebase.firestore().collection("meta").doc("current").get()
                .then(metaDoc => {
                    const currentTestId = metaDoc.exists ? metaDoc.data().testId : null;
                    if (!currentTestId) throw new Error("Test ID not found");

                    // Check if this user already attempted
                    return firebase.firestore()
                        .collection("results")
                        .where("userId", "==", userId)
                        .where("testId", "==", currentTestId)
                        .get()
                        .then(resultSnap => {
                            if (!resultSnap.empty) {
                                loginError.textContent = "You've already taken this test. Please wait for the next one.";
                                return;
                            }

                            // All clear: Start quiz
                            document.getElementById("form-container").classList.add("hidden");
                            document.getElementById("quiz-container").classList.remove("hidden");
                            startQuiz(); // your function to load and show quiz
                        });
                });
        })
        .catch(error => {
            console.error("Login error:", error);
            loginError.textContent = "Error logging in. Please try again.";
        });
}
function startQuiz() {
    const meta = JSON.parse(localStorage.getItem('mcqMeta'));
    let timeLeft = meta?.timeLimit || 60;

    document.getElementById('form-container').classList.add('hidden');
    document.getElementById('quiz-container').classList.remove('hidden');
    loadQuestionsFromStorage();

    document.getElementById('time').textContent = `${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s`;

    timerInterval = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('time').textContent = `${minutes}m ${seconds}s`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitQuiz();
            alert('Time is up!');
        }
    }, 1000);
}

function loadQuestionsFromStorage() {
    const savedMCQs = localStorage.getItem('mcqData');
    document.getElementById('questions-area').innerHTML = savedMCQs || '<p>No MCQs loaded yet.</p>';
}

function submitQuiz() {
    clearInterval(timerInterval);

    const meta = JSON.parse(localStorage.getItem('mcqMeta'));
    const correctAnswers = meta?.correctAnswers || {};
    const testId = meta?.testId;

    let score = 0;
    const form = document.getElementById('quiz-form');
    for (let key in correctAnswers) {
        const selected = form.querySelector(`input[name="${key}"]:checked`);
        if (selected && selected.value === correctAnswers[key]) {
            score++;
        }
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
    const resultEntry = {
        name: currentUser.name || 'Unknown',
        contact: currentUser.contact || '',
        correct: score,
        wrong: Object.keys(correctAnswers).length - score,
        timestamp: new Date().toISOString(),
        testId: testId
    };

    const allResults = JSON.parse(localStorage.getItem('userResults')) || [];
    allResults.push(resultEntry);
    localStorage.setItem('userResults', JSON.stringify(allResults));

    document.getElementById('quiz-form').classList.add('hidden');
    const resultDiv = document.getElementById('result');
    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = `You scored ${score} out of ${Object.keys(correctAnswers).length}`;
}
