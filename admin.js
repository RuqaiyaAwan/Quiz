document.addEventListener('DOMContentLoaded', function () {
    const secretPassword = "MySuperSecret123";
    let parsedMCQs = '';
    let correctAnswers = {};
    let testTimer = 60;

    window.checkAdmin = function () {
        const enteredPassword = document.getElementById('adminPassword').value;
        if (enteredPassword === secretPassword) {
            document.getElementById('admin-login').classList.add('hidden');
            document.getElementById('admin-panel').classList.remove('hidden');
        } else {
            alert("Wrong password!");
        }
    }

    window.loadQuestions = function () {
        const fileInput = document.getElementById('fileInput');
        const preview = document.getElementById('preview');

        if (fileInput.files.length === 0) {
            alert("Please select a .txt file.");
            return;
        }

        const file = fileInput.files[0];
        const reader = new FileReader();

        // Clear the previous results upon new file upload
        localStorage.removeItem('userResults');

        reader.onload = function (e) {
            const text = e.target.result;
            parseMCQText(text);
            preview.innerHTML = parsedMCQs;
        };

        reader.readAsText(file);
    }

    function parseMCQText(text) {
        const lines = text.split('\n');
        let questionIndex = 1;
        parsedMCQs = '';
        correctAnswers = {};
        testTimer = 60;
        let currentQuestionText = '', currentOptions = '', inputName = '', timerSet = false;

        lines.forEach(line => {
            const text = line.trim();
            if (!timerSet && text.startsWith('[TIMER:')) {
                const match = text.match(/\[TIMER:\s*(\d+)\]/i);
                if (match) {
                    testTimer = parseInt(match[1]) * 60;
                    timerSet = true;
                }
            } else if (/^\d+\./.test(text)) {
                if (currentQuestionText && currentOptions) {
                    parsedMCQs += `<div class="question"><h3>${currentQuestionText}</h3>${currentOptions}</div>`;
                    questionIndex++;
                }
                currentQuestionText = text;
                currentOptions = '';
                inputName = `q${questionIndex}`;
            } else if (/^[\*\-]?[A-Da-d]\./.test(text)) {
                const isCorrect = /^\*/.test(text);
                const cleanOption = text.replace(/^\*\s*/, '');
                currentOptions += `<label><input type="radio" name="${inputName}" value="${cleanOption}"> ${cleanOption}</label>`;
                if (isCorrect) {
                    correctAnswers[inputName] = cleanOption;
                }
            }
        });

        if (currentQuestionText && currentOptions) {
            parsedMCQs += `<div class="question"><h3>${currentQuestionText}</h3>${currentOptions}</div>`;
        }
    }

    window.saveQuestions = function () {
        if (!parsedMCQs || Object.keys(correctAnswers).length === 0) {
            alert("No valid questions or correct answers found. Did you mark answers with '*'?");
            return;
        }

        // Clear previous results when uploading a new test
        localStorage.removeItem('userResults');

        localStorage.setItem('mcqData', parsedMCQs);
        const meta = {
            correctAnswers: correctAnswers,
            timeLimit: testTimer,
            testId: Date.now()
        };
        localStorage.setItem('mcqMeta', JSON.stringify(meta));
        alert('Questions and timer saved successfully!');
    }

    window.downloadCSV = function () {
        const results = JSON.parse(localStorage.getItem('userResults')) || [];
        if (!results.length) {
            alert("No results found.");
            return;
        }

        let csv = "Name,Contact,Correct,Wrong,Timestamp,Test ID\n";
        results.forEach(r => {
            csv += `${r.name},${r.contact},${r.correct},${r.wrong},${r.timestamp},${r.testId}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'quiz_results.csv';
        link.click();
        URL.revokeObjectURL(url);
    }
});
