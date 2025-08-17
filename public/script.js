document.addEventListener('DOMContentLoaded', () => {
    // --- Job Application Form Logic ---
    const jobApplicationForm = document.getElementById('job-application-form');
    if (jobApplicationForm) {
        jobApplicationForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const applicationData = {
                name: document.getElementById('jobName').value,
                email: document.getElementById('jobEmail').value,
                phone: document.getElementById('jobPhone').value,
                position: document.getElementById('jobPosition').value,
                message: document.getElementById('jobMessage').value
            };

            try {
                const res = await fetch('/api/job-applications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(applicationData)
                });

                const data = await res.json();
                document.getElementById('job-form-message').textContent = data.message;
                if (data.success) {
                    jobApplicationForm.reset();
                }
            } catch (err) {
                console.error('Error submitting job application:', err);
                document.getElementById('job-form-message').textContent = 'Error submitting application.';
            }
        });
    }

    // --- Theme Toggle (Dark/Light Mode) ---
    const themeToggle = document.getElementById('theme-toggle');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeButtons = document.querySelectorAll('.close-button');

    // Function to apply theme
    function applyTheme(isDarkMode) {
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            if (themeToggle) themeToggle.checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            if (themeToggle) themeToggle.checked = false;
        }
    }

    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        applyTheme(true);
    } else {
        applyTheme(false); // Default to light if no preference or 'light'
    }

    // Event listener for theme toggle in settings modal
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                applyTheme(true);
                localStorage.setItem('theme', 'dark');
            } else {
                applyTheme(false);
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // Open settings modal
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            if (settingsModal) {
                settingsModal.style.display = 'block';
                // Ensure the toggle reflects current theme when modal opens
                applyTheme(document.body.classList.contains('dark-mode'));
            }
        });
    }

    // Close modals
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Close modal if clicked outside
    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
        // Also close service modal if clicked outside
        const serviceModal = document.getElementById('service-modal');
        if (event.target === serviceModal) {
            serviceModal.style.display = 'none';
        }
    });

    // --- Service Modals ---
    const serviceModal = document.getElementById('service-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const learnMoreBtns = document.querySelectorAll('.learn-more-btn');

    const serviceDetails = {
        residential: {
            title: "Residential Cleaning",
            description: "Our residential cleaning service covers everything from dusting and vacuuming to kitchen and bathroom sanitization. We offer flexible scheduling options (weekly, bi-weekly, monthly) to fit your lifestyle. Our team uses high-quality, eco-friendly products to ensure a safe and sparkling clean home for you and your family."
        },
        commercial: {
            title: "Commercial Cleaning",
            description: "Maintain a professional and hygienic workspace with our commercial cleaning services. We cater to offices, retail spaces, and other businesses, providing services like floor care, waste removal, restroom cleaning, and common area maintenance. A clean environment boosts productivity and leaves a great impression on clients."
        },
        deep: {
            title: "Deep Cleaning",
            description: "When your space needs an intensive refresh, our deep cleaning service is the answer. This comprehensive clean goes beyond the surface, tackling grime, dirt, and dust in hard-to-reach areas. It includes detailed cleaning of appliances, scrubbing grout, extensive dusting, and thorough sanitization, leaving your property immaculately clean."
        },
        move: {
            title: "Move-in/Move-out Cleaning",
            description: "Simplify your moving process with our specialized move-in/move-out cleaning. For tenants, this service helps ensure you get your full deposit back. For landlords or new homeowners, we prepare the property for its next occupants, ensuring it's spotless and welcoming. We cover all aspects, from deep cleaning kitchens and bathrooms to wiping down all surfaces and cleaning inside cabinets."
        },
        pressure: {
            title: "Pressure Pipe Cleaning",
            description: "Our pressure pipe cleaning service uses high-pressure water jets to effectively clear stubborn blockages and buildup in your drainage systems. This method is highly efficient for removing grease, debris, and roots, restoring optimal flow and preventing future issues. It's a non-invasive solution that protects your pipes while ensuring long-term efficiency."
        }
    };

    learnMoreBtns.forEach(button => {
        button.addEventListener('click', (event) => {
            const serviceType = event.target.dataset.service;
            const details = serviceDetails[serviceType];
            if (details && serviceModal && modalTitle && modalDescription) {
                modalTitle.textContent = details.title;
                modalDescription.textContent = details.description;
                serviceModal.style.display = 'block';
            }
        });
    });

    // --- Public Appointments Display ---
    // Corrected: Target the actual tbody element for appointments
    const appointmentsBody = document.getElementById('appointmentsBody');

    async function fetchPublicAppointments() {
        if (!appointmentsBody) return; // Ensure the element exists

        try {
            const response = await fetch('/api/appointments');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const appointments = await response.json();
            console.log('Appointments data from server:', appointments);

            displayPublicAppointments(appointments);
        } catch (error) {
            console.error('Error fetching public appointments:', error);
            // Corrected: Use colspan 5 for error message to span all columns
            appointmentsBody.innerHTML = '<tr><td colspan="5" class="error-message">Failed to load appointments. Please try again later.</td></tr>';
        }
    }

    function displayPublicAppointments(appointments) {
        if (!appointmentsBody) return; // Ensure the element exists

        appointmentsBody.innerHTML = ''; // Clear previous content

        // Filter for future appointments and sort by date/time
        const now = new Date();
        const futureAppointments = appointments.filter(app => {
            const appDateTime = new Date(`${app.date}T${app.time}`);
            return appDateTime > now;
        }).sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        });

        if (futureAppointments.length === 0) {
            // Corrected: Use colspan 5 for no appointments message
            appointmentsBody.innerHTML = '<tr><td colspan="5">No upcoming appointments scheduled at the moment. Check back soon!</td></tr>';
            return;
        }

        // Build table rows from future appointments
        let tableRowsHtml = '';
        futureAppointments.forEach(app => {
            const row = `
                <tr>
                    <td>${app.clientName}</td>
                    <td>${app.service}</td>
                    <td>${new Date(app.date).toLocaleDateString()}</td>
                    <td>${app.time}</td>
                    <td>${app.location || 'N/A'}</td> <!-- This now correctly includes app.location -->
                </tr>
            `;
            tableRowsHtml += row;
        });
        appointmentsBody.innerHTML = tableRowsHtml; // Append all rows at once for better performance
    }

    // --- Contact Form (Complaint/Report) Logic ---
    const complaintReportForm = document.getElementById('complaint-report-form');
    const formMessage = document.getElementById('form-message');

    if (complaintReportForm) {
        complaintReportForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                senderName: document.getElementById('senderName').value,
                senderEmail: document.getElementById('senderEmail').value,
                senderPhone: document.getElementById('senderPhone').value,
                type: document.getElementById('messageType').value,
                message: document.getElementById('message').value
            };

            try {
                const response = await fetch('/api/complaints', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (response.ok) {
                    if (formMessage) {
                        formMessage.className = 'success-message';
                        formMessage.textContent = 'Message sent successfully! We will get back to you soon.';
                    }
                    complaintReportForm.reset();
                } else {
                    if (formMessage) {
                        formMessage.className = 'error-message';
                        formMessage.textContent = result.message || 'Failed to send message. Please try again.';
                    }
                }
            } catch (error) {
                console.error('Error sending message:', error);
                if (formMessage) {
                    formMessage.className = 'error-message';
                    formMessage.textContent = 'An error occurred. Please try again.';
                }
            }
        });
    }

    // --- Public Media Gallery Functionality ---
    const publicMediaGallery = document.getElementById('publicMediaGallery');
    const noPublicMediaMessage = document.getElementById('no-public-media-message');

    // Helper function to get media from localStorage (same as in admin.js)
    function getMedia() {
        try {
            const media = JSON.parse(localStorage.getItem('media')) || [];
            return media;
        } catch (e) {
            console.error("Error parsing media from localStorage:", e);
            return [];
        }
    }

    // Function to display media on the public site
    function displayPublicMedia() {
        if (!publicMediaGallery) return;

        const media = getMedia();
        publicMediaGallery.innerHTML = '';

        if (media.length === 0) {
            if (noPublicMediaMessage) noPublicMediaMessage.style.display = 'block';
            return;
        }
        if (noPublicMediaMessage) noPublicMediaMessage.style.display = 'none';

        media.forEach(item => {
            const mediaItemDiv = document.createElement('div');
            mediaItemDiv.className = 'public-media-item';

            let mediaElement;
            if (item.type.startsWith('image/')) {
                mediaElement = document.createElement('img');
                mediaElement.src = item.src;
                mediaElement.alt = item.name;
            } else if (item.type.startsWith('video/')) {
                mediaElement = document.createElement('video');
                mediaElement.src = item.src;
                mediaElement.controls = true;
                mediaElement.preload = 'metadata';
            } else {
                // Fallback for unsupported types
                mediaElement = document.createElement('p');
                mediaElement.textContent = `Unsupported file type: ${item.name}`;
            }

            mediaItemDiv.appendChild(mediaElement);
            mediaItemDiv.appendChild(document.createElement('p')).textContent = item.name;
            publicMediaGallery.appendChild(mediaItemDiv);
        });
    }

    // Initial calls on page load
    fetchPublicAppointments();
    displayPublicMedia();
});