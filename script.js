let timerInterval;

function validateLogin() {
    const usernameInput = document.getElementById('username').value.trim().toLowerCase();
    const contactInput = document.getElementById('contact').value.trim();

    const matchedUser = registeredUsers.find(user =>
        user.name.toLowerCase() === usernameInput && user.contact === contactInput
    );

    if (!matchedUser) {
        document.getElementById('login-error').textContent = "Invalid name or contact.";
        return;
    }

    const meta = JSON.parse(localStorage.getItem('mcqMeta'));
    const currentTestId = meta?.testId;
    const allResults = JSON.parse(localStorage.getItem('userResults')) || [];

    const alreadyAttempted = allResults.find(result =>
        result.name.toLowerCase() === usernameInput &&
        result.contact === contactInput &&
        result.testId === currentTestId
    );

    if (alreadyAttempted) {
        document.getElementById('login-error').textContent = "You've already taken this test. Please wait for the next one.";
        return;
    }

    localStorage.setItem('currentUser', JSON.stringify({
        name: matchedUser.name,
        contact: matchedUser.contact
    }));

    startQuiz();
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
