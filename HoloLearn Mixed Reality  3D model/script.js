// Main Application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    const sceneManager = new SceneManager('scene-container');
    const voiceSystem = new VoiceSystem();
    const quizEngine = new QuizEngine();
    const aiOrchestrator = new AIOrchestrator();
    const uiManager = new UIManager(sceneManager, voiceSystem, quizEngine, aiOrchestrator);
    
    // Set up initial scene
    sceneManager.init();
    uiManager.initEventListeners();
    
    // Load default topic
    uiManager.loadTopic('solar-system');
});

// Scene Manager with working models and animations
class SceneManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.models = {};
        this.animations = [];
        this.availableModels = {
            'sun': 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Planet.glb',
            'earth': 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Earth.glb',
            'heart': 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Heart.glb',
            'volcano': 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Volcano.glb'
        };
    }

    init() {
        // Set up Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            this.container.clientWidth / this.container.clientHeight, 
            0.1, 
            1000
        );
        this.camera.position.z = 5;
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        
        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
        
        // Resize handler
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Start animation loop
        this.animate();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update animations
        this.animations.forEach(animation => animation.update());
        
        // Update controls
        this.controls.update();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
    
    async loadModel(modelName, position = { x: 0, y: 0, z: 0 }, scale = 1) {
        return new Promise((resolve, reject) => {
            if (this.models[modelName]) {
                resolve(this.models[modelName]);
                return;
            }
            
            if (!this.availableModels[modelName]) {
                reject(new Error(`Model ${modelName} not available`));
                return;
            }
            
            const loader = new THREE.GLTFLoader();
            loader.load(
                this.availableModels[modelName],
                (gltf) => {
                    const model = gltf.scene;
                    model.position.set(position.x, position.y, position.z);
                    model.scale.set(scale, scale, scale);
                    
                    // Add special handling for specific models
                    if (modelName === 'sun') {
                        // Make the sun glow
                        const sunLight = new THREE.PointLight(0xffaa33, 2, 10);
                        sunLight.position.set(0, 0, 0);
                        model.add(sunLight);
                    }
                    
                    this.scene.add(model);
                    this.models[modelName] = model;
                    resolve(model);
                },
                undefined,
                (error) => {
                    console.error('Error loading model:', error);
                    reject(error);
                }
            );
        });
    }
    
    clearScene() {
        // Remove all models
        Object.values(this.models).forEach(model => {
            this.scene.remove(model);
        });
        this.models = {};
        
        // Clear animations
        this.animations = [];
    }
    
    addAnimation(animation) {
        this.animations.push(animation);
    }
    
    createOrbitAnimation(object, center, speed = 0.01, radius = 3) {
        const animation = {
            object,
            center,
            angle: 0,
            radius: radius,
            speed,
            update: function() {
                this.angle += this.speed;
                this.object.position.x = this.center.x + Math.cos(this.angle) * this.radius;
                this.object.position.z = this.center.z + Math.sin(this.angle) * this.radius;
                this.object.rotation.y += 0.01;
            }
        };
        
        this.addAnimation(animation);
        return animation;
    }
    
    createBeatingAnimation(object, speed = 0.05, intensity = 0.1) {
        const originalScale = object.scale.clone();
        const animation = {
            object,
            originalScale,
            time: 0,
            speed,
            intensity,
            update: function() {
                this.time += this.speed;
                const scaleFactor = 1 + Math.sin(this.time) * this.intensity;
                this.object.scale.x = this.originalScale.x * scaleFactor;
                this.object.scale.y = this.originalScale.y * scaleFactor;
                this.object.scale.z = this.originalScale.z * scaleFactor;
            }
        };
        
        this.addAnimation(animation);
        return animation;
    }
}

// Voice System (unchanged from previous implementation)
class VoiceSystem {
    constructor() {
        this.synth = window.speechSynthesis;
        this.utterance = null;
        this.recognition = null;
        this.isVoiceEnabled = true;
        this.isListening = false;
    }
    
    speak(text) {
        if (!this.isVoiceEnabled) return;
        
        if (this.synth.speaking) {
            this.synth.cancel();
        }
        
        this.utterance = new SpeechSynthesisUtterance(text);
        this.utterance.rate = 0.9;
        this.utterance.pitch = 1;
        this.utterance.volume = 1;
        
        this.synth.speak(this.utterance);
    }
    
    toggleVoice() {
        this.isVoiceEnabled = !this.isVoiceEnabled;
        return this.isVoiceEnabled;
    }
    
    startListening(callback) {
        if (!('webkitSpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            return false;
        }
        
        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        
        this.recognition.onstart = () => {
            this.isListening = true;
        };
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            callback(transcript);
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
        };
        
        this.recognition.start();
        return true;
    }
    
    stopListening() {
        if (this.recognition) {
            this.recognition.stop();
        }
    }
}

// Quiz Engine (unchanged from previous implementation)
class QuizEngine {
    constructor() {
        this.currentQuiz = null;
    }
    
    createQuiz(quizData) {
        this.currentQuiz = quizData;
        return quizData;
    }
    
    checkAnswer(selectedOption) {
        if (!this.currentQuiz) return null;
        
        const isCorrect = selectedOption === this.currentQuiz.correctAnswer;
        return {
            isCorrect,
            correctAnswer: this.currentQuiz.correctAnswer,
            feedback: isCorrect ? this.currentQuiz.correctFeedback : this.currentQuiz.incorrectFeedback
        };
    }
}

// AI Orchestrator with updated model and animation configurations
class AIOrchestrator {
    constructor() {
        this.topics = {
            'solar-system': {
                name: 'Solar System',
                description: 'Learn about our solar system and planetary motion',
                responses: {
                    'explain': {
                        narration: 'This is our solar system. The Sun is at the center, and planets like Earth orbit around it due to gravity. The Sun is a massive star that provides light and heat to all the planets in our solar system.',
                        actions: [
                            { type: 'loadModel', model: 'sun', position: { x: 0, y: 0, z: 0 }, scale: 1.5 },
                            { type: 'loadModel', model: 'earth', position: { x: 3, y: 0, z: 0 }, scale: 0.7 },
                            { type: 'animate', animation: 'orbit', object: 'earth', center: { x: 0, y: 0, z: 0 }, speed: 0.01, radius: 3 }
                        ],
                        quiz: {
                            question: 'What keeps Earth in orbit around the Sun?',
                            options: [
                                'Electromagnetic forces',
                                'Gravity',
                                'Solar wind',
                                'Centrifugal force'
                            ],
                            correctAnswer: 'Gravity',
                            correctFeedback: 'Correct! Gravity is the force that keeps Earth in orbit around the Sun.',
                            incorrectFeedback: 'Not quite. The correct answer is Gravity, which is the attractive force between two masses.'
                        }
                    },
                    'scale': {
                        narration: 'The scale of our solar system is enormous. The Sun is much larger than Earth - about 109 times wider. The distance between them is about 150 million kilometers!',
                        actions: [
                            { type: 'loadModel', model: 'sun', position: { x: 0, y: 0, z: 0 }, scale: 2 },
                            { type: 'loadModel', model: 'earth', position: { x: 5, y: 0, z: 0 }, scale: 0.2 },
                            { type: 'animate', animation: 'orbit', object: 'earth', center: { x: 0, y: 0, z: 0 }, speed: 0.005, radius: 5 }
                        ]
                    }
                }
            },
            'heart-anatomy': {
                name: 'Heart Anatomy',
                description: 'Explore the structure and function of the human heart',
                responses: {
                    'explain': {
                        narration: 'This is a model of the human heart. It has four chambers: two atria on top and two ventricles below. The heart pumps blood throughout the body, delivering oxygen and nutrients to tissues.',
                        actions: [
                            { type: 'loadModel', model: 'heart', position: { x: 0, y: 0, z: 0 }, scale: 1.2 },
                            { type: 'animate', animation: 'beat', object: 'heart', speed: 0.1, intensity: 0.1 }
                        ],
                        quiz: {
                            question: 'How many chambers does the human heart have?',
                            options: ['2', '3', '4', '5'],
                            correctAnswer: '4',
                            correctFeedback: 'That\'s right! The heart has four chambers: two atria and two ventricles.',
                            incorrectFeedback: 'Actually, the human heart has four chambers: two atria and two ventricles.'
                        }
                    },
                    'function': {
                        narration: 'The heart functions as a pump. The right side receives oxygen-poor blood and sends it to the lungs. The left side receives oxygen-rich blood from the lungs and pumps it to the body.',
                        actions: [
                            { type: 'loadModel', model: 'heart', position: { x: 0, y: 0, z: 0 }, scale: 1.2 },
                            { type: 'animate', animation: 'beat', object: 'heart', speed: 0.15, intensity: 0.15 }
                        ]
                    }
                }
            },
            'volcano': {
                name: 'Volcano',
                description: 'Learn about volcanic structures and eruptions',
                responses: {
                    'explain': {
                        narration: 'This is a volcano. It forms when magma from within the Earth erupts through the crust. Volcanoes can be found on land and under the ocean, and they play a key role in shaping Earth\'s surface.',
                        actions: [
                            { type: 'loadModel', model: 'volcano', position: { x: 0, y: -1, z: 0 }, scale: 1.5 }
                        ],
                        quiz: {
                            question: 'What is molten rock beneath the Earth\'s surface called?',
                            options: ['Lava', 'Magma', 'Igneous', 'Basalt'],
                            correctAnswer: 'Magma',
                            correctFeedback: 'Correct! Magma is molten rock below the surface, which becomes lava when it erupts.',
                            incorrectFeedback: 'Not quite. The correct answer is Magma. Lava is what it\'s called after it erupts.'
                        }
                    },
                    'eruption': {
                        narration: 'During a volcanic eruption, magma rises through the volcano\'s conduit and is expelled as lava, ash, and gases. The type of eruption depends on the magma\'s viscosity and gas content.',
                        actions: [
                            { type: 'loadModel', model: 'volcano', position: { x: 0, y: -1, z: 0 }, scale: 1.5 },
                            { type: 'animate', animation: 'pulse', object: 'volcano', speed: 0.2, intensity: 0.05 }
                        ]
                    }
                }
            }
        };
    }
    
    async processQuery(topic, query) {
        // Simple intent detection
        let intent = 'unknown';
        
        if (query.toLowerCase().includes('explain')) {
            intent = 'explain';
        } else if (query.toLowerCase().includes('scale') && topic === 'solar-system') {
            intent = 'scale';
        } else if (query.toLowerCase().includes('function') && topic === 'heart-anatomy') {
            intent = 'function';
        } else if (query.toLowerCase().includes('eruption') && topic === 'volcano') {
            intent = 'eruption';
        }
        
        const topicData = this.topics[topic];
        if (!topicData) return null;
        
        if (topicData.responses[intent]) {
            return {
                topic: topic,
                intent: intent,
                response: topicData.responses[intent]
            };
        }
        
        // Default to explain if intent not found
        return {
            topic: topic,
            intent: 'explain',
            response: topicData.responses.explain || {
                narration: "I'm not sure how to answer that. Try asking me to explain this topic.",
                actions: []
            }
        };
    }
    
    getTopicList() {
        return Object.keys(this.topics).map(key => ({
            id: key,
            name: this.topics[key].name,
            description: this.topics[key].description
        }));
    }
}

// Updated UI Manager with enhanced model loading and animation handling
class UIManager {
    constructor(sceneManager, voiceSystem, quizEngine, aiOrchestrator) {
        this.sceneManager = sceneManager;
        this.voiceSystem = voiceSystem;
        this.quizEngine = quizEngine;
        this.aiOrchestrator = aiOrchestrator;
        this.currentTopic = null;
    }
    
    initEventListeners() {
        // Topic selection
        document.querySelectorAll('.topic-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const topic = btn.dataset.topic;
                this.loadTopic(topic);
            });
        });
        
        // Chat input
        document.getElementById('send-btn').addEventListener('click', () => this.handleUserInput());
        document.getElementById('user-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUserInput();
        });
        
        // Mic button
        document.getElementById('mic-btn').addEventListener('click', () => this.toggleSpeechInput());
        
        // Voice toggle
        document.getElementById('tts-toggle').addEventListener('click', () => {
            const isEnabled = this.voiceSystem.toggleVoice();
            document.getElementById('voice-status').textContent = `Voice: ${isEnabled ? 'Enabled' : 'Disabled'}`;
        });
    }
    
    async loadTopic(topicId) {
        this.currentTopic = topicId;
        
        // Clear current scene
        this.sceneManager.clearScene();
        
        // Display loading state
        this.addChatMessage('AI Teacher', `Loading ${this.aiOrchestrator.topics[topicId].name} lesson...`, 'ai');
        
        try {
            // Load topic introduction
            const response = await this.aiOrchestrator.processQuery(topicId, 'explain');
            this.handleAIResponse(response);
        } catch (error) {
            console.error('Error loading topic:', error);
            this.addChatMessage('AI Teacher', 'Sorry, I encountered an error loading this topic.', 'ai');
        }
    }
    
    async handleUserInput() {
        const inputElement = document.getElementById('user-input');
        const userInput = inputElement.value.trim();
        
        if (!userInput) return;
        
        // Add user message to chat
        this.addChatMessage('You', userInput, 'user');
        inputElement.value = '';
        
        // Show loading indicator
        const loadingId = this.showLoading();
        
        try {
            // Process query with AI
            const response = await this.aiOrchestrator.processQuery(this.currentTopic, userInput);
            
            // Remove loading indicator
            this.hideLoading(loadingId);
            
            // Handle AI response
            this.handleAIResponse(response);
        } catch (error) {
            console.error('Error processing query:', error);
            this.hideLoading(loadingId);
            this.addChatMessage('AI Teacher', 'Sorry, I encountered an error processing your request.', 'ai');
        }
    }
    
    handleAIResponse(response) {
        if (!response) return;
        
        // Add AI narration to chat
        this.addChatMessage('AI Teacher', response.response.narration, 'ai');
        
        // Speak the response
        this.voiceSystem.speak(response.response.narration);
        
        // Execute scene actions
        this.executeSceneActions(response.response.actions);
        
        // If there's a quiz, display it
        if (response.response.quiz) {
            this.displayQuiz(response.response.quiz);
        }
    }
    
    async executeSceneActions(actions) {
        for (const action of actions) {
            try {
                switch (action.type) {
                    case 'loadModel':
                        await this.sceneManager.loadModel(
                            action.model,
                            action.position || { x: 0, y: 0, z: 0 },
                            action.scale || 1
                        );
                        break;
                        
                    case 'animate':
                        const model = this.sceneManager.models[action.object];
                        if (model) {
                            if (action.animation === 'orbit') {
                                this.sceneManager.createOrbitAnimation(
                                    model,
                                    action.center || { x: 0, y: 0, z: 0 },
                                    action.speed || 0.01,
                                    action.radius || 3
                                );
                            } else if (action.animation === 'beat') {
                                this.sceneManager.createBeatingAnimation(
                                    model,
                                    action.speed || 0.1,
                                    action.intensity || 0.1
                                );
                            } else if (action.animation === 'pulse') {
                                this.sceneManager.createBeatingAnimation(
                                    model,
                                    action.speed || 0.2,
                                    action.intensity || 0.05
                                );
                            }
                        }
                        break;
                }
            } catch (error) {
                console.error(`Error executing action ${action.type}:`, error);
            }
        }
    }
    
    displayQuiz(quizData) {
        const quizContainer = document.getElementById('quiz-container');
        const quizQuestion = document.getElementById('quiz-question');
        const quizOptions = document.getElementById('quiz-options');
        const quizFeedback = document.getElementById('quiz-feedback');
        
        // Set up quiz
        this.quizEngine.createQuiz(quizData);
        
        // Display question
        quizQuestion.textContent = quizData.question;
        
        // Display options
        quizOptions.innerHTML = '';
        quizData.options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.textContent = option;
            btn.addEventListener('click', () => this.handleQuizAnswer(option));
            quizOptions.appendChild(btn);
        });
        
        // Hide feedback and show quiz
        quizFeedback.classList.add('hidden');
        quizContainer.classList.remove('hidden');
    }
    
    handleQuizAnswer(selectedOption) {
        const result = this.quizEngine.checkAnswer(selectedOption);
        const feedbackElement = document.getElementById('quiz-feedback');
        
        if (result) {
            feedbackElement.textContent = result.feedback;
            feedbackElement.className = 'quiz-feedback ' + (result.isCorrect ? 'correct' : 'incorrect');
            feedbackElement.classList.remove('hidden');
            
            // Speak feedback
            this.voiceSystem.speak(result.isCorrect ? 'Correct! ' + result.feedback : 'Incorrect. ' + result.feedback);
        }
    }
    
    addChatMessage(sender, message, type) {
        const chatMessages = document.getElementById('chat-messages');
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${type}-message`);
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    showLoading() {
        const chatMessages = document.getElementById('chat-messages');
        const loadingElement = document.createElement('div');
        loadingElement.classList.add('message', 'ai-message', 'loading');
        loadingElement.id = 'loading-' + Date.now();
        loadingElement.textContent = 'AI Teacher is thinking...';
        chatMessages.appendChild(loadingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return loadingElement.id;
    }
    
    hideLoading(id) {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    }
    
    toggleSpeechInput() {
        const micBtn = document.getElementById('mic-btn');
        
        if (this.voiceSystem.isListening) {
            this.voiceSystem.stopListening();
            micBtn.textContent = '🎤';
        } else {
            const started = this.voiceSystem.startListening((transcript) => {
                document.getElementById('user-input').value = transcript;
                micBtn.textContent = '🎤';
                this.handleUserInput();
            });
            
            if (started) {
                micBtn.textContent = '🔴';
            }
        }
    }
}