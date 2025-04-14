// Constants
const API_BASE_URL = 'http://localhost:5000';
const SOCKET_URL = 'http://localhost:5000';

// DOM Elements
const loginForm = document.getElementById('login-form');
const userInfo = document.getElementById('user-info');
const userEmail = document.getElementById('user-email');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const projectList = document.getElementById('project-list');
const newProjectName = document.getElementById('new-project-name');
const newProjectDescription = document.getElementById('new-project-description');
const createProjectButton = document.getElementById('create-project-button');
const noProjectSelected = document.getElementById('no-project-selected');
const projectContent = document.getElementById('project-content');
const projectTitle = document.getElementById('project-title');
const projectDescription = document.getElementById('project-description');
const conversationMessages = document.getElementById('conversation-messages');
const messageInput = document.getElementById('message-input');
const sendMessageButton = document.getElementById('send-message-button');
const builderStatus = document.getElementById('builder-status');
const judgeStatus = document.getElementById('judge-status');

// State
let currentUser = null;
let token = localStorage.getItem('token');
let projects = [];
let currentProject = null;
let conversations = [];
let currentConversation = null;
let messages = [];
let socket = null;

// Initialize the application
function init() {
    // Check if user is logged in
    if (token) {
        loginForm.style.display = 'none';
        userInfo.style.display = 'flex';
        userEmail.textContent = localStorage.getItem('userEmail') || 'User';
        fetchProjects();
        initializeSocket();
    }

    // Event listeners
    loginButton.addEventListener('click', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
    createProjectButton.addEventListener('click', handleCreateProject);
    sendMessageButton.addEventListener('click', handleSendMessage);
}

// Authentication
async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // For demo purposes, we'll simulate a successful login
        // In a real app, you would make an API call to authenticate
        const mockResponse = {
            token: 'mock-token-12345',
            user: { email }
        };
        
        token = mockResponse.token;
        currentUser = mockResponse.user;
        
        localStorage.setItem('token', token);
        localStorage.setItem('userEmail', email);
        
        loginForm.style.display = 'none';
        userInfo.style.display = 'flex';
        userEmail.textContent = email;
        
        fetchProjects();
        initializeSocket();
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed. Please try again.');
    }
}

function handleLogout() {
    token = null;
    currentUser = null;
    currentProject = null;
    projects = [];
    
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    
    loginForm.style.display = 'flex';
    userInfo.style.display = 'none';
    projectList.innerHTML = '';
    noProjectSelected.style.display = 'block';
    projectContent.style.display = 'none';
    
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

// Projects
async function fetchProjects() {
    try {
        // For demo purposes, we'll use mock data
        // In a real app, you would make an API call to fetch projects
        const mockProjects = [
            { id: '1', name: 'Personal Website', description: 'A portfolio website showcasing my work and skills.' },
            { id: '2', name: 'E-commerce Store', description: 'An online store for selling handmade crafts.' },
            { id: '3', name: 'Blog Platform', description: 'A content management system for publishing blog posts.' }
        ];
        
        projects = mockProjects;
        renderProjects();
    } catch (error) {
        console.error('Failed to fetch projects:', error);
        alert('Failed to load projects. Please try again.');
    }
}

function renderProjects() {
    projectList.innerHTML = '';
    
    projects.forEach(project => {
        const projectElement = document.createElement('div');
        projectElement.className = 'project-item';
        if (currentProject && currentProject.id === project.id) {
            projectElement.classList.add('active');
        }
        
        projectElement.textContent = project.name;
        projectElement.addEventListener('click', () => selectProject(project));
        
        projectList.appendChild(projectElement);
    });
}

function selectProject(project) {
    currentProject = project;
    renderProjects();
    
    noProjectSelected.style.display = 'none';
    projectContent.style.display = 'block';
    
    projectTitle.textContent = project.name;
    projectDescription.textContent = project.description;
    
    fetchConversations(project.id);
    
    if (socket) {
        socket.emit('join_project', project.id);
    }
}

async function handleCreateProject() {
    const name = newProjectName.value.trim();
    const description = newProjectDescription.value.trim();
    
    if (!name) {
        alert('Please enter a project name.');
        return;
    }
    
    try {
        // For demo purposes, we'll simulate creating a project
        // In a real app, you would make an API call to create the project
        const newProject = {
            id: Date.now().toString(),
            name,
            description
        };
        
        projects.push(newProject);
        renderProjects();
        
        newProjectName.value = '';
        newProjectDescription.value = '';
        
        selectProject(newProject);
    } catch (error) {
        console.error('Failed to create project:', error);
        alert('Failed to create project. Please try again.');
    }
}

// Conversations
async function fetchConversations(projectId) {
    try {
        // For demo purposes, we'll use mock data
        // In a real app, you would make an API call to fetch conversations
        const mockConversation = {
            id: '1',
            projectId,
            messages: [
                { role: 'system', content: 'Welcome to the MCP System with LangChain integration!', timestamp: new Date().toISOString() },
                { role: 'builder', content: 'I am the Builder agent powered by Claude. I can help you build your website.', timestamp: new Date().toISOString() },
                { role: 'judge', content: 'I am the Judge agent powered by GPT-4o. I will evaluate the Builder\'s work and provide feedback.', timestamp: new Date().toISOString() }
            ]
        };
        
        currentConversation = mockConversation;
        messages = mockConversation.messages;
        
        renderMessages();
    } catch (error) {
        console.error('Failed to fetch conversations:', error);
        alert('Failed to load conversation. Please try again.');
    }
}

function renderMessages() {
    conversationMessages.innerHTML = '';
    
    messages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.role}`;
        
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        contentElement.textContent = message.content;
        
        const timestampElement = document.createElement('div');
        timestampElement.className = 'message-timestamp';
        timestampElement.textContent = new Date(message.timestamp).toLocaleTimeString();
        
        messageElement.appendChild(contentElement);
        messageElement.appendChild(timestampElement);
        
        conversationMessages.appendChild(messageElement);
    });
    
    // Scroll to bottom
    conversationMessages.scrollTop = conversationMessages.scrollHeight;
}

async function handleSendMessage() {
    const content = messageInput.value.trim();
    
    if (!content || !currentProject) {
        return;
    }
    
    try {
        // Add user message to the conversation
        const userMessage = {
            role: 'user',
            content,
            timestamp: new Date().toISOString()
        };
        
        messages.push(userMessage);
        renderMessages();
        
        messageInput.value = '';
        
        // Simulate API call to send message
        // In a real app, you would make an API call to send the message
        
        // Update agent status
        builderStatus.textContent = 'Thinking...';
        builderStatus.classList.add('active');
        
        // Simulate builder response after 2 seconds
        setTimeout(() => {
            const builderMessage = {
                role: 'builder',
                content: 'I\'ll help you with that! Let me start by creating a basic structure for your website.',
                timestamp: new Date().toISOString()
            };
            
            messages.push(builderMessage);
            renderMessages();
            
            builderStatus.textContent = 'Idle';
            builderStatus.classList.remove('active');
            
            // Simulate judge response after another 2 seconds
            judgeStatus.textContent = 'Thinking...';
            judgeStatus.classList.add('active');
            
            setTimeout(() => {
                const judgeMessage = {
                    role: 'judge',
                    content: 'That\'s a good approach. Make sure to include responsive design for mobile devices.',
                    timestamp: new Date().toISOString()
                };
                
                messages.push(judgeMessage);
                renderMessages();
                
                judgeStatus.textContent = 'Idle';
                judgeStatus.classList.remove('active');
            }, 2000);
        }, 2000);
    } catch (error) {
        console.error('Failed to send message:', error);
        alert('Failed to send message. Please try again.');
    }
}

// Socket.io
function initializeSocket() {
    try {
        socket = io(SOCKET_URL);
        
        socket.on('connect', () => {
            console.log('Socket connected');
            
            if (currentProject) {
                socket.emit('join_project', currentProject.id);
            }
        });
        
        socket.on('message', (message) => {
            if (currentConversation && message.conversationId === currentConversation.id) {
                messages.push(message);
                renderMessages();
                
                // Update agent status
                if (message.role === 'builder') {
                    builderStatus.textContent = 'Idle';
                    builderStatus.classList.remove('active');
                } else if (message.role === 'judge') {
                    judgeStatus.textContent = 'Idle';
                    judgeStatus.classList.remove('active');
                }
            }
        });
        
        socket.on('agent_status', (status) => {
            if (status.role === 'builder') {
                builderStatus.textContent = status.status;
                if (status.status === 'Thinking') {
                    builderStatus.classList.add('active');
                } else {
                    builderStatus.classList.remove('active');
                }
            } else if (status.role === 'judge') {
                judgeStatus.textContent = status.status;
                if (status.status === 'Thinking') {
                    judgeStatus.classList.add('active');
                } else {
                    judgeStatus.classList.remove('active');
                }
            }
        });
        
        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });
    } catch (error) {
        console.error('Socket initialization failed:', error);
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
