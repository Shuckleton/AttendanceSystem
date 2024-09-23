document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    
    // Remove active classes and add inactive class to all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('bg-green-600', 'text-white');
        btn.classList.add('inactive-tab');
    });
    
    // Add active classes to the clicked button and remove inactive class
    button.classList.add('bg-green-600', 'text-white');
    button.classList.remove('inactive-tab');
    
    // Show the content of the clicked tab
    if (button.id === 'tab-mark-attendance') {
        document.getElementById('mark-attendance-tab').classList.remove('hidden');
    } else if (button.id === 'tab-add-employee') {
        document.getElementById('add-employee-tab').classList.remove('hidden');
    } else if (button.id === 'tab-view-records') {
        document.getElementById('view-records-tab').classList.remove('hidden');
    } else if (button.id === 'tab-real-time-dashboard') {
        document.getElementById('real-time-dashboard-tab').classList.remove('hidden');
    } else if (button.id === 'tab-create-task') {
        document.getElementById('create-task-tab').classList.remove('hidden');
    } else if (button.id === 'tab-assign-task') {
        document.getElementById('assign-task-tab').classList.remove('hidden');
    } else if (button.id === 'tab-edit-employee') {
    document.getElementById('edit-employee-tab').classList.remove('hidden');
}
});
});

document.addEventListener('DOMContentLoaded', function() {
    const qrInput = document.getElementById('qr-input');
    const markAttendanceButton = document.getElementById('mark-attendance');

    if (qrInput && markAttendanceButton) {
        qrInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent the default action, which is usually form submission or a new line
                markAttendanceButton.click(); // Simulate a click on the button
            }
        });
    }
});
    // Mark attendance functionality
    document.getElementById('mark-attendance').addEventListener('click', async function() {
        const qrInput = document.getElementById('qr-input').value;
        const customTimeOut = document.getElementById('custom-time-out').value;

        let response = await fetch('/mark_attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                qr_code_data: qrInput,
                custom_time_out: customTimeOut || null  // Send custom time if provided
            })
        });

        let result = await response.json();
        const scanResult = document.getElementById('scan-result');
        
        if (result.success) {
            scanResult.textContent = result.message;
            scanResult.classList.remove('hidden');
            document.getElementById('time-out-option').classList.remove('hidden'); // Show custom time-out option
        } else {
            scanResult.textContent = result.message;
            scanResult.classList.remove('hidden');
        }
    });

    

    

    document.getElementById('tab-real-time-dashboard').addEventListener('click', function() {
        fetchEmployees();
    });
    
    // Event listeners for filters and search
    document.getElementById('status-filter').addEventListener('change', fetchEmployees);
    document.getElementById('unit-type-filter').addEventListener('change', fetchEmployees);
    document.getElementById('deployment-area-filter').addEventListener('change', fetchEmployees);
    document.getElementById('search-input').addEventListener('input', fetchEmployees);
    
    function fetchEmployees() {
        const statusFilter = document.getElementById('status-filter').value;
        const unitTypeFilter = document.getElementById('unit-type-filter').value;
        const deploymentAreaFilter = document.getElementById('deployment-area-filter').value;
        const searchQuery = document.getElementById('search-input').value.toLowerCase();
    
        // Create query parameters
        const queryParams = new URLSearchParams({
            status: statusFilter,
            unit_type: unitTypeFilter,
            deployment_area: deploymentAreaFilter,
            search: searchQuery
        });
    
        fetch(`/get_employees?${queryParams.toString()}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log(data); // Debug log to check data structure
                updateEmployeeTable(data);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
    
    function updateEmployeeTable(data) {
        const employeeList = document.getElementById('employee-list');
        const employeeGrid = document.getElementById('employee-grid');
    
        if (!employeeList || !employeeGrid) {
            console.error('Required elements are missing from the DOM');
            return;
        }
    
        employeeList.innerHTML = ''; // Clear the current list
        employeeGrid.innerHTML = ''; // Clear the current grid
    
        // Initialize counts
        let totalEmployees = data.length;
        let totalPresent = 0;
        let totalAbsent = 0;
    
        if (data && Array.isArray(data)) {
            data.forEach(employee => {
                // Update present and absent counts
                if (employee.status === 'Active') {
                    totalPresent++;
                } else {
                    totalAbsent++;
                }
    
                // Get the actual barangay name
                const barangayName = barangayMap[employee.deployment_area] || employee.deployment_area;
    
                // Create a new row for each employee in table mode
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="py-2 px-4 border-b">${employee.first_name}</td>
                    <td class="py-2 px-4 border-b">${employee.last_name}</td>
                    <td class="py-2 px-4 border-b">${employee.designation}</td>
                    <td class="py-2 px-4 border-b">${barangayName}</td>
                    <td class="py-2 px-4 border-b">${employee.unit_type || 'N/A'}</td>
                    <td class="py-2 px-4 border-b">${employee.status}</td>
                    <td class="py-2 px-4 border-b"><img src="../static/id_pictures/${employee.id_picture}" alt="ID Picture" class="w-16 h-16 rounded"></td>
                `;
                employeeList.appendChild(row);
    
                // Create a new card for each employee in grid mode
                const card = document.createElement('div');
                card.classList.add('bg-white', 'shadow-md', 'rounded-lg', 'p-4', 'border', 'border-gray-200', 'flex', 'flex-col', 'items-center', 'text-center', 'transition', 'transform', 'hover:scale-105');
    
                // Create the status indicator based on employee status
                const statusIndicator = employee.status === 'Active' ? 
                    `<span class="status-indicator active"></span>` : 
                    `<span class="status-indicator"></span>`;
    
                card.innerHTML = `
                    <img src="../static/id_pictures/${employee.id_picture}" alt="ID Picture" class="w-24 h-24 rounded-full mb-4">
                    <h3 class="text-lg font-semibold">${employee.first_name} ${employee.last_name}</h3>
                    <p class="text-sm text-gray-600">${employee.designation}</p>
                    <p class="text-sm text-gray-500">${barangayName}</p>
                    <p class="text-sm text-gray-400">${employee.unit_type || 'N/A'}</p>
                    <p class="mt-2 px-2 py-1 text-xs rounded-full ${employee.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}">${employee.status}</p>
                    ${statusIndicator}
                `;
                employeeGrid.appendChild(card);
            });
        }
    
        // Update the totals in the boxes
        document.getElementById('total-employees').innerText = `Total Employees: ${totalEmployees}`;
        document.getElementById('total-present').innerText = `Present: ${totalPresent}`;
        document.getElementById('total-absent').innerText = `Absent: ${totalAbsent}`;
    }

    

    // Close modal functionality
    document.getElementById('close-modal').addEventListener('click', function() {
        document.getElementById('success-modal').classList.add('hidden'); // Hide the modal
    });

    // Toggle between table and grid mode
    document.getElementById('toggle-grid').addEventListener('click', function() {
        const isGridMode = document.getElementById('employee-grid').classList.contains('hidden');
        
        // Toggle visibility
        document.getElementById('employee-table').classList.toggle('hidden', isGridMode);
        document.getElementById('employee-grid').classList.toggle('hidden', !isGridMode);
        
        // Update button text and icon
        const toggleIcon = document.getElementById('toggle-icon');
        const toggleText = document.getElementById('toggle-text');
        
        if (isGridMode) {
            toggleIcon.innerHTML = '<i class="fas fa-table"></i>'; // Switch to table icon
            toggleText.textContent = 'Switch to Table Mode';
        } else {
            toggleIcon.innerHTML = '<i class="fas fa-th"></i>'; // Switch to grid icon
            toggleText.textContent = 'Switch to Grid Mode';
        }
    });

    document.addEventListener('DOMContentLoaded', function() {
        // Fetch deployment areas and populate the dropdown
        fetch('/get_deployment_areas')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(deploymentAreas => {
                const deploymentAreaFilter = document.getElementById('deployment-area-filter');
                deploymentAreas.forEach(area => {
                    const option = document.createElement('option');
                    option.value = area;
                    option.textContent = area;
                    deploymentAreaFilter.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error:', error);
            });
    
        // Bind event listeners
        document.getElementById('tab-real-time-dashboard').addEventListener('click', function() {
            fetchEmployees();
        });
    
        document.getElementById('status-filter').addEventListener('change', fetchEmployees);
        document.getElementById('unit-type-filter').addEventListener('change', fetchEmployees);
        document.getElementById('deployment-area-filter').addEventListener('change', fetchEmployees);
        document.getElementById('search-input').addEventListener('input', fetchEmployees);
    });

// Define the barangay mapping
const barangayMap = {
    "Daang Hari Intersection": "Daang Hari Intersection",
    "Versailles - Daang Hari": "Versailles - Daang Hari",
    "T.S Cruz": "T.S Cruz",
    "Almanza - BF Pilar": "Almanza - BF Pilar",
    "SM Southmall": "SM Southmall",
    "Golden Gate Entrance": "Golden Gate Entrance",
    "Moonwalk Intersection": "Moonwalk Intersection",
    "Moonwalk Gate - Talon Singko": "Moonwalk Gate - Talon Singko",
    "Southland - Puregold": "Southland - Puregold",
    "Admiral": "Admiral",
    "Pelayo - LTO": "Pelayo - LTO",
    "Casimiro Intersection": "Casimiro Intersection",
    "Hypermarket Clean Fuel": "Hypermarket Clean Fuel",
    "Uniwide": "Uniwide",
    "Times - Perpetual": "Times - Perpetual",
    "Times - Intersection": "Times - Intersection",
    "F. Ocampo 7-11": "F. Ocampo 7-11",
    "City Hall - Front": "City Hall - Front",
    "City Hall - Pedestrian Lane": "City Hall - Pedestrian Lane",
    "SM Center": "SM Center",
    "Verdant Intersection": "Verdant Intersection",
    "Vistamall": "Vistamall",
    "Red Ribbon - Pamplona": "Red Ribbon - Pamplona",
    "RFC - Doña Manuela Intersection": "RFC - Doña Manuela Intersection",
    "Rosal St. (PAV) Mayor's Residence": "Rosal St. (PAV) Mayor's Residence",
    "Pamplona Elementary School": "Pamplona Elementary School",
    "Tramo Road": "Tramo Road",
    "Zapote Junction": "Zapote Junction",
    "Pulanlupa Uno (7-11)": "Pulanlupa Uno (7-11)",
    "C-5 Intersection": "C-5 Intersection",
    "Bamboo Organ": "Bamboo Organ"
};

// Inside the view records tab click event listener
document.getElementById('tab-view-records').addEventListener('click', async function() {
    try {
        // Fetch employee names for dropdown
        const response = await fetch('/get_employees');
        if (!response.ok) throw new Error('Failed to fetch employees');

        const employees = await response.json();

        const employeeDropdown = document.getElementById('employee-dropdown');
        employeeDropdown.innerHTML = '<option value="">Select Employee</option>'; // Reset the dropdown

        employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.id; // Assuming each employee has an 'id' field
            option.textContent = `${employee.first_name} ${employee.last_name}`;
            employeeDropdown.appendChild(option);
        });

        // Call fetchAttendanceRecords to display records with the selected filter
        fetchAttendanceRecords();
    } catch (error) {
        console.error('Error fetching employee list:', error);
        alert('Failed to load employee list. Please try again later.');
    }
});

// Add event listener to the filter button
document.getElementById('filter-btn').addEventListener('click', debounce(fetchAttendanceRecords, 300));

async function fetchAttendanceRecords() {
    const employeeId = document.getElementById('employee-dropdown').value; // Get selected employee ID
    const dateFrom = document.getElementById('filter-date-from').value; // Get start date
    const dateUntil = document.getElementById('filter-date-until').value; // Get end date

    try {
        const response = await fetch('/get_attendance_records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ dateFrom, dateUntil, employee: employeeId }), // Pass date range and employee ID
        });

        if (!response.ok) throw new Error('Failed to fetch attendance records');

        const data = await response.json();
        const recordsTableBody = document.getElementById('records-table-body');
        recordsTableBody.innerHTML = ''; // Clear previous records

        if (data.records && Array.isArray(data.records) && data.records.length > 0) {
            data.records.forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="py-2 px-4 border-b">${record.first_name} ${record.last_name}</td>
                    <td class="py-2 px-4 border-b">${record.designation}</td>
                    <td class="py-2 px-4 border-b">${record.status}</td>
                    <td class="py-2 px-4 border-b">${record.time_in}</td>
                    <td class="py-2 px-4 border-b">${record.time_out}</td>
                `;
                recordsTableBody.appendChild(row);
            });
        } else {
            recordsTableBody.innerHTML = '<tr><td colspan="5" class="py-2 px-4 border-b">No records found.</td></tr>';
        }
    } catch (error) {
        console.error('Error fetching attendance records:', error);
     
    }
}

document.getElementById('export-btn').addEventListener('click', async function() {
    try {
        const employeeId = document.getElementById('employee-dropdown').value; // Get selected employee ID
        const dateFrom = document.getElementById('filter-date-from').value; // Get start date
        const dateUntil = document.getElementById('filter-date-until').value; // Get end date

        const response = await fetch('/export_attendance_records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ dateFrom, dateUntil, employee: employeeId }), // Pass date range and employee ID
        });

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'attendance_records.csv'; // or any other name you want
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export records. Please try again later.');
    }
});

// Debounce function to limit the rate of function execution
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-task');
    const clearSearchButton = document.getElementById('clear-search');
    const sortTaskButton = document.getElementById('sort-task');
    const sortDateButton = document.getElementById('sort-date');
    const designationFilter = document.getElementById('designation-filter');
    const deploymentAreaFilter = document.getElementById('deployment-area-filter');
    const dateFilter = document.getElementById('date-filter');
    const tableBody = document.getElementById('schedules-body');

    // Fetch and populate dropdown options
    function populateFilters() {
        fetch('/get_filter_options')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    populateDropdown(designationFilter, data.designations);
                    populateDropdown(deploymentAreaFilter, data.areas);
                } else {
                    console.error('Error fetching filter options:', data.message);
                }
            })
            .catch(error => console.error('Error:', error));
    }

    function populateDropdown(dropdown, options) {
        dropdown.innerHTML = '<option value="">Select...</option>';
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            dropdown.appendChild(optionElement);
        });
    }

    function fetchSchedules() {
        const searchValue = searchInput.value.toLowerCase();
        const designationValue = designationFilter.value;
        const deploymentAreaValue = deploymentAreaFilter.value;
        const dateValue = dateFilter.value;

        fetch(`/view_schedules?search=${encodeURIComponent(searchValue)}&designation=${encodeURIComponent(designationValue)}&deployment_area=${encodeURIComponent(deploymentAreaValue)}&date=${encodeURIComponent(dateValue)}`)
            .then(response => response.json())
            .then(data => {
                console.log(data.schedules); // Debugging line
                if (data.status === 'success') {
                    populateTable(data.schedules);
                } else {
                    console.error('Error fetching schedules:', data.message);
                }
            })
            .catch(error => console.error('Error:', error));
    }

    function populateTable(schedules) {
        tableBody.innerHTML = ''; // Clear existing rows
        
        schedules.forEach(schedule => {
            console.log(schedule); // Debugging line

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${schedule[0] || '-'}</td>
                <td>${schedule[1] || '-'}</td>
                <td>${schedule[2] ? schedule[2] + ' ' + schedule[3] : '-'}</td>
                <td>${schedule[4] || '-'}</td>
                <td>${schedule[5] || '-'}</td>
                <td>${schedule[6] || '-'}</td>
                <td>${schedule[7] || '-'}</td>
                <td>${schedule[8] || '-'}</td>
                <td>${schedule[9] || '-'}</td>
            `;
            tableBody.appendChild(row);
        });
    }
    function populateFilters() {
        fetch('/get_filter_options')
            .then(response => response.json())
            .then(data => {
                console.log(data); // Debugging line
                if (data.status === 'success') {
                    populateDropdown(designationFilter, data.designations);
                    populateDropdown(deploymentAreaFilter, data.areas);
                } else {
                    console.error('Error fetching filter options:', data.message);
                }
            })
            .catch(error => console.error('Error:', error));
    }
    

    function sortTable(columnIndex, isAscending) {
        const rows = Array.from(tableBody.getElementsByTagName('tr'));
        rows.sort((a, b) => {
            const aText = a.getElementsByTagName('td')[columnIndex].textContent.trim();
            const bText = b.getElementsByTagName('td')[columnIndex].textContent.trim();
            
            if (isAscending) {
                return aText.localeCompare(bText);
            } else {
                return bText.localeCompare(aText);
            }
        });

        rows.forEach(row => tableBody.appendChild(row));
    }

    function applySearch() {
        const searchValue = searchInput.value.toLowerCase();
        const rows = tableBody.getElementsByTagName('tr');
        
        Array.from(rows).forEach(row => {
            const cells = row.getElementsByTagName('td');
            let visible = false;
            
            Array.from(cells).forEach(cell => {
                if (cell.textContent.toLowerCase().includes(searchValue)) {
                    visible = true;
                }
            });
            
            row.style.display = visible ? '' : 'none';
        });
    }

    // Event listeners
    searchInput.addEventListener('input', function() {
        applySearch();
        fetchSchedules();
    });

    clearSearchButton.addEventListener('click', function() {
        searchInput.value = '';
        applySearch();
        fetchSchedules();
    });

    designationFilter.addEventListener('change', fetchSchedules);
    deploymentAreaFilter.addEventListener('change', fetchSchedules);
    dateFilter.addEventListener('change', fetchSchedules);

    sortTaskButton.addEventListener('click', () => {
        sortTable(0, true); // Sort by Task in ascending order
    });

    sortDateButton.addEventListener('click', () => {
        sortTable(7, true); // Sort by Start Date in ascending order
    });

    // Initial fetch and populate filters
    fetchSchedules();
    populateFilters();
});


document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('create-task-form');
    const resultDiv = document.getElementById('create-task-result');

    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent form submission

            const formData = new FormData(form);

            fetch(form.action, {
                method: 'POST',
                body: formData,
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    resultDiv.classList.remove('text-red-600');
                    resultDiv.classList.add('text-blue-600');
                } else {
                    resultDiv.classList.remove('text-blue-600');
                    resultDiv.classList.add('text-red-600');
                }
                resultDiv.textContent = data.message;
                resultDiv.classList.remove('hidden');
                // Optionally, clear the form fields on success
                if (data.status === 'success') {
                    form.reset();
                }
            })
            .catch(error => {
                resultDiv.classList.remove('text-blue-600');
                resultDiv.classList.add('text-red-600');
                resultDiv.textContent = `Error: ${error.message}`;
                resultDiv.classList.remove('hidden');
            });
        });
    } else {
        console.error('Form element not found.');
    }
});

function logout() {
    // Send a GET request to the /logout route
    fetch('/logout', {
        method: 'GET',
        credentials: 'same-origin' // Ensures the session cookie is sent with the request
    })
    .then(response => {
        if (response.ok) {
            // Redirect to the home page after successful logout
            window.location.href = '/';
        } else {
            alert('Logout failed. Please try again.');
        }
    })
    .catch(error => console.error('Error:', error));
}

document.addEventListener('DOMContentLoaded', function() {
    fetch('/get_employees')
        .then(response => response.json())
        .then(data => {
            console.log('Employees data:', data); // Log the data to check its structure
            const selectElement = document.getElementById('employee_id');
            selectElement.innerHTML = ''; // Clear existing options

            data.forEach(employee => {
                console.log('Employee:', employee); // Log each employee object
                const option = document.createElement('option');
                option.value = employee.id;
                option.textContent = `${employee.first_name} ${employee.last_name}`; // Combine names
                selectElement.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching employees:', error));
});

document.addEventListener('DOMContentLoaded', function() {
    // Fetch employee options for the table
    fetch('/get_employees')
        .then(response => response.json())
        .then(employees => {
            const tasksTableBody = document.getElementById('tasksTableBody');
            employees.forEach(employee => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="py-2 px-4 border-b">${employee.first_name} ${employee.last_name}</td>
                    <td class="py-2 px-4 border-b">
                        <select class="form-select mt-1 block w-full" name="task_type_${employee.id}">
                            <option value="Fixed Position">Fixed Position</option>
                            <option value="Motorcycle Unit">Motorcycle Unit</option>

                        </select>
                    </td>
                `;
                tasksTableBody.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching employees:', error));
});
// Get the fullscreen toggle button and the dashboard content element
const fullscreenToggle = document.getElementById('fullscreen-toggle');
const dashboardContent = document.getElementById('real-time-dashboard-tab');

// Function to toggle fullscreen mode
function toggleFullscreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.error("Error exiting fullscreen mode:", err));
        fullscreenToggle.innerHTML = '<i class="fas fa-expand"></i>'; // Update button text
    } else {
        dashboardContent.requestFullscreen().catch(err => console.error("Error entering fullscreen mode:", err));
        fullscreenToggle.innerHTML = '<i class="fas fa-compress"></i>'; // Update button text
    }
}

// Add click event listener to the fullscreen button
fullscreenToggle.addEventListener('click', toggleFullscreen);

// Optional: Handle fullscreen change events
document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        dashboardContent.classList.add('fullscreen');
    } else {
        dashboardContent.classList.remove('fullscreen');
    }
});

document.getElementById('add-employee-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    fetch('/add_employee', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Construct the HTML string
            const employeeInfoHtml = `
                <p>First Name: ${formData.get('first_name')}</p>
                <p>Last Name: ${formData.get('last_name')}</p>
                <p>Designation: ${formData.get('designation')}</p>
                <p>Deployment Area: ${formData.get('deployment_area')}</p>
            `;

            // Update the employee-info element
            document.getElementById('employee-info').innerHTML = employeeInfoHtml;
            document.getElementById('qr-code-modal').src = data.qr_code_url; // Use the correct URL from the response
            document.getElementById('qr-code-display-modal').classList.remove('hidden');
            document.getElementById('success-modal').classList.remove('hidden'); // Show the modal
        } else {
            document.getElementById('add-employee-result').innerText = 'Failed to add employee.';
            document.getElementById('add-employee-result').classList.remove('hidden');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});
document.getElementById('employee-search').addEventListener('input', function() {
    const searchQuery = this.value;

    if (searchQuery.length < 3) {
        return; // Only search if the query is at least 3 characters long
    }

    fetch(`/search_employee?query=${encodeURIComponent(searchQuery)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.employee) {
                // Populate the form fields with employee details
                document.getElementById('employee-details').classList.remove('hidden');
                document.getElementById('edit-first-name').value = data.employee.first_name;
                document.getElementById('edit-last-name').value = data.employee.last_name;
                document.getElementById('edit-designation').value = data.employee.designation;
                document.getElementById('edit-deployment-area').value = data.employee.deployment_area;
                document.getElementById('edit-unit-type').value = data.employee.unit_type;
                document.getElementById('edit-employee-id').value = data.employee.id; // Set the Employee ID
                document.getElementById('edit-employee-result').classList.add('hidden');
            } else {
                document.getElementById('employee-details').classList.add('hidden');
                document.getElementById('edit-employee-result').textContent = data.message || 'Employee not found.';
                document.getElementById('edit-employee-result').classList.remove('hidden');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('edit-employee-result').textContent = 'An error occurred while searching for the employee.';
            document.getElementById('edit-employee-result').classList.remove('hidden');
        });
});
document.getElementById('edit-employee-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData(this);
    
    fetch('/edit_employee', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('edit-employee-result').textContent = data.message;
            document.getElementById('edit-employee-result').classList.remove('hidden');
        } else {
            document.getElementById('edit-employee-result').textContent = data.message || 'An error occurred.';
            document.getElementById('edit-employee-result').classList.remove('hidden');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('edit-employee-result').textContent = 'An error occurred while updating employee information.';
        document.getElementById('edit-employee-result').classList.remove('hidden');
    });
});
