// DOM Elements
const loginPage = document.getElementById('login-page');
const mainApp = document.getElementById('main-app');
const loginBtn = document.getElementById('login-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');
const themeToggle = document.getElementById('theme-toggle');
const searchBySelect = document.getElementById('search-by');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const fieldCheckboxes = document.getElementById('field-checkboxes');
const fieldCheckboxesContainer = document.getElementById('field-checkboxes-container');
const toggleFieldsBtn = document.getElementById('toggle-fields-btn');
const cardsContainer = document.getElementById('cards-container');
const resultCount = document.getElementById('result-count');
const exportBtn = document.getElementById('export-btn');

// App State
let allAssets = [];
let filteredAssets = [];
let selectedFields = new Set();
let availableFields = [];

// Google Apps Script Web App URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyKXRxiggFGuisMz2m8NXwD-OPVAv4B2fMsSTl7UIpa3DAnYaH_l7AEfg5O7zn-1Dim/exec';

// Initialize the app
function init() {
    // Check for saved theme preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        document.querySelector('.login-form')?.classList.add('dark-mode');
    }

    // Set up event listeners
    setupEventListeners();

    // Load data from Google Sheets
    fetchData();
}

// Set up event listeners
function setupEventListeners() {
    // Login
    loginBtn.addEventListener('click', handleLogin);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Search
    searchInput.addEventListener('input', filterAssets);
    searchBySelect.addEventListener('change', filterAssets);
    searchBtn.addEventListener('click', filterAssets);

    // Field selection toggle
    toggleFieldsBtn.addEventListener('click', toggleFieldSelection);

    // Export
    exportBtn.addEventListener('click', exportToCSV);
}

// Handle login
function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (username === 'user' && password === '9909') {
        loginError.style.display = 'none';
        loginPage.style.display = 'none';
        mainApp.classList.remove('hidden');
    } else {
        loginError.style.display = 'block';
    }
}

// Toggle dark/light theme
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    document.querySelector('.login-form')?.classList.toggle('dark-mode');
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
}

// Toggle field selection visibility
function toggleFieldSelection() {
    fieldCheckboxesContainer.classList.toggle('expanded');
    const icon = toggleFieldsBtn.querySelector('i');
    if (fieldCheckboxesContainer.classList.contains('expanded')) {
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
        // Set focus to the first checkbox when expanded
        const firstCheckbox = fieldCheckboxes.querySelector('input[type="checkbox"]');
        if (firstCheckbox) firstCheckbox.focus();
    } else {
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
}

// Fetch data from Google Sheets
async function fetchData() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        
        if (data && data.length > 0) {
            allAssets = data;
            filteredAssets = [...allAssets];
            
            // Extract available fields from first item
            availableFields = Object.keys(allAssets[0]);
            
            // Set default selected fields (first 6 fields or all if less than 6)
            selectedFields = new Set(availableFields.slice(0, 6));
            
            // Populate search dropdown
            populateSearchDropdown();
            
            // Render field checkboxes
            renderFieldCheckboxes();
            
            // Render initial cards
            renderCards();
            updateResultCount();
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load data. Please try again later.');
    }
}

// Populate search dropdown with available fields
function populateSearchDropdown() {
    searchBySelect.innerHTML = '';
    
    // Add "All Fields" option
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Fields';
    searchBySelect.appendChild(allOption);
    
    // Add all available fields
    availableFields.forEach(field => {
        const option = document.createElement('option');
        option.value = field;
        option.textContent = field;
        searchBySelect.appendChild(option);
    });
}

// Render field checkboxes for selecting which fields to display
function renderFieldCheckboxes() {
    fieldCheckboxes.innerHTML = '';

    availableFields.forEach(field => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'field-checkbox';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `field-${field}`;
        checkbox.value = field;
        checkbox.checked = selectedFields.has(field);
        checkbox.addEventListener('change', handleFieldSelectionChange);

        const label = document.createElement('label');
        label.htmlFor = `field-${field}`;
        label.textContent = field;

        checkboxDiv.appendChild(checkbox);
        checkboxDiv.appendChild(label);
        fieldCheckboxes.appendChild(checkboxDiv);
    });
}

// Handle field selection changes
function handleFieldSelectionChange(e) {
    const field = e.target.value;
    
    if (e.target.checked) {
        selectedFields.add(field);
    } else {
        selectedFields.delete(field);
    }
    
    renderCards();
}

// Filter assets based on search criteria
function filterAssets() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const searchField = searchBySelect.value;

    if (!searchTerm) {
        filteredAssets = [...allAssets];
    } else {
        filteredAssets = allAssets.filter(asset => {
            if (searchField === 'all') {
                // Search across all fields
                return Object.entries(asset).some(([key, value]) => {
                    // Skip empty values and ensure value is a string
                    if (!value || typeof value !== 'string') return false;
                    return value.toLowerCase().includes(searchTerm);
                });
            } else {
                // Search in specific field
                const fieldValue = asset[searchField];
                // Skip if field doesn't exist or value is empty
                if (!fieldValue || typeof fieldValue !== 'string') return false;
                return String(fieldValue).toLowerCase().includes(searchTerm);
            }
        });
    }

    renderCards();
    updateResultCount();
}

// Render asset cards
function renderCards() {
    cardsContainer.innerHTML = '';

    if (filteredAssets.length === 0) {
        const noResults = document.createElement('div');
        noResults.textContent = 'No matching assets found.';
        cardsContainer.appendChild(noResults);
        return;
    }

    filteredAssets.forEach(asset => {
        const card = document.createElement('div');
        card.className = 'card';

        // Add a title (using the first available field with data)
        let title = 'Asset';
        for (const field of selectedFields) {
            if (asset[field]) {
                title = asset[field];
                break;
            }
        }
        
        const cardTitle = document.createElement('h3');
        cardTitle.textContent = title;
        card.appendChild(cardTitle);

        // Add selected fields
        Array.from(selectedFields).forEach(field => {
            if (asset[field] !== undefined && asset[field] !== '') {
                const fieldDiv = document.createElement('div');
                fieldDiv.className = 'card-field';

                const fieldLabel = document.createElement('strong');
                fieldLabel.textContent = `${field}: `;

                const fieldValue = document.createElement('span');
                fieldValue.textContent = asset[field];

                fieldDiv.appendChild(fieldLabel);
                fieldDiv.appendChild(fieldValue);
                card.appendChild(fieldDiv);
            }
        });

        cardsContainer.appendChild(card);
    });
}

// Update result count display
function updateResultCount() {
    resultCount.textContent = `${filteredAssets.length} result${filteredAssets.length !== 1 ? 's' : ''} found`;
}

// Export to CSV
function exportToCSV() {
    if (filteredAssets.length === 0) {
        alert('No data to export.');
        return;
    }

    // Get headers from selected fields
    const headers = Array.from(selectedFields);

    // Create CSV content
    let csvContent = headers.join(',') + '\n';

    filteredAssets.forEach(asset => {
        const row = headers.map(header => {
            let value = asset[header] || '';
            // Escape quotes and wrap in quotes if contains comma
            value = String(value).replace(/"/g, '""');
            if (value.includes(',')) {
                value = `"${value}"`;
            }
            return value;
        }).join(',');
        
        csvContent += row + '\n';
    });

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assets_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);