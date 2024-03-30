const apiKeyContainer = document.getElementById('apiKeyContainer');
const apiKeyInput = document.getElementById('apiKeyInput');
const submitApiKey = document.getElementById('submitApiKey');
const resumeContainer = document.getElementById('resumeContainer');
const resumeInput = document.getElementById('resumeInput');
const saveResume = document.getElementById('saveResume');
const jobDescContainer = document.getElementById('jobDescContainer');
const jobDescInput = document.getElementById('jobDescInput');
const generateCoverLetter = document.getElementById('generateCoverLetter');
const outputContainer = document.getElementById('outputContainer');
const coverLetterOutput = document.getElementById('coverLetterOutput');

var model = 'gpt-4-0125-preview';

// Prompt
const defaultSysPrompt = "You are a helpful assistant. You are very intelligent, mature, scientific, prudent and effective. Act as a professional career mentor, who is specifically tasked to write customized, concise and effective cover letter tailored with respect to a given resume and job descriptions.";
const defaultUserPromptSuffix = "Generate a customized, very short (try not to exceed two paragraphs), concise and straight to the point and effective cover letter based on the given resume and job description. Aim for a semi casual tone to show confidence, and do not appear desperated and bootlicking. You should strive to specifically appeal to the skills specified in the job description that the candidate resume also demonstrates, or may have demonstrated based on your discretion. Only return the cover letter starting by something like \"Dear [company name] hiring manager,\". If you don't feel like you see a company name anywhere, leave the general placeholder."

const systemPromptInput = document.getElementById('systemPromptInput');
// Set the value of the input to the defaultSysPrompt
systemPromptInput.value = defaultSysPrompt;
// Check for changes in the system prompt input
systemPromptInput.addEventListener('change', function () {
    const userInput = systemPromptInput.value.trim();
    if (userInput !== defaultSysPrompt) {
        localStorage.setItem('systemPrompt', userInput);
    } else {
        localStorage.removeItem('systemPrompt');
    }
});

const togglePrompts = document.getElementById('togglePrompts');
const promptsContainer = document.getElementById('promptsContainer');

togglePrompts.addEventListener('click', function () {
    // Check if the prompts have already been added
    if (promptsContainer.children.length === 0) {
        const sysPromptElement = document.createElement('p');
        sysPromptElement.textContent = defaultSysPrompt;

        const mid = document.createElement('p');
        mid.textContent = "[Your resume and job descriptions will be concatenated here.]"

        const userPromptSuffixElement = document.createElement('p');
        userPromptSuffixElement.textContent = defaultUserPromptSuffix;

        promptsContainer.appendChild(sysPromptElement);
        promptsContainer.appendChild(mid);
        promptsContainer.appendChild(userPromptSuffixElement);
    }
    // Toggle the display of the promptsContainer
    promptsContainer.style.display = promptsContainer.style.display === 'none' ? 'block' : 'none';
});


// Check if API key exists in local storage
chrome.storage.local.get('apiKey', function (data) {
    if (data.apiKey) {
        apiKeyInput.value = '*'.repeat(data.apiKey.length);
        // apiKeyInput.disabled = true;
        // submitApiKey.disabled = true;
    }
});

// Save API key to local storage
submitApiKey.addEventListener('click', function () {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
        chrome.storage.local.set({ apiKey: apiKey }, function () {
            apiKeyInput.value = '*'.repeat(apiKey.length);
            // apiKeyInput.disabled = true;
            // submitApiKey.disabled = true;
        });
    }
});

// Check if resume content exists in local storage
chrome.storage.local.get('resumeContent', function (data) {
    if (data.resumeContent) {
        resumeInput.value = data.resumeContent;
    }
});

// Save resume content to local storage
saveResume.addEventListener('click', function () {
    const resumeContent = resumeInput.value.trim();
    if (resumeContent) {
        chrome.storage.local.set({ resumeContent: resumeContent });
    }
});

// Generate cover letter
generateCoverLetter.addEventListener('click', function () {
    const jobDescription = jobDescInput.value.trim();
    const jobDescAlert = document.getElementById('jobDescAlert');
    // Fetch the selected model from the dropdown
    const selectedModel = document.getElementById('modelSelect').value;
    if (jobDescription && jobDescription.split(' ').length >= 10) {
        document.getElementById('feedback').innerText = 'Generating cover letter. This may take a while depending on length of the resume and job description or OpenAI\'s volume.';
        jobDescAlert.textContent = ''; // Clear the alert
        chrome.storage.local.get(['apiKey', 'resumeContent'], function (data) {
            const apiKey = data.apiKey;
            const resumeContent = data.resumeContent;
            if (apiKey && resumeContent) {
                // Pass the selected model to the function
                generateCoverLetterFromAPI(apiKey, resumeContent, jobDescription, selectedModel);
            } else {
                alert('Please provide your API key and resume content.');
            }
        });
    } else {
        jobDescAlert.textContent = 'Please provide a job description with at least 10 words.';
    }
});

// Generate cover letter using OpenAI Chat API
async function generateCoverLetterFromAPI(apiKey, resumeContent, jobDescription, model) {
    const prompt = `Resume:\n${resumeContent}\n\nJob Description:\n${jobDescription}\n\n${defaultUserPromptSuffix}\n`;

    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            messages: [{ role: 'system', content: defaultSysPrompt },
            { role: 'user', content: prompt }],
            model: model,
        })
    };

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', requestOptions);
        const data = await response.json();
        const coverLetter = data.choices[0].message.content.trim();
        coverLetterOutput.value = coverLetter;
        downloadCoverLetter(coverLetter);
    } catch (error) {
        console.error('Error generating cover letter:', error);
        alert('An error occurred while generating the cover letter. Please try again.');
    }
}

// Download cover letter as a .txt file
function downloadCoverLetter(coverLetter) {
    const blob = new Blob([coverLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cover_letter_${Date.now()}.txt`;
    link.click();
}

