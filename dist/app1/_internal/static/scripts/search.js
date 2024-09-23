document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search-input');
    const employeeTable = document.getElementById('employee-list');
    const employeeGrid = document.getElementById('employee-grid');

    searchInput.addEventListener('input', function () {
        const query = searchInput.value.toLowerCase();

        // Fetch employees data (this assumes you have a function to get employees data)
        fetch('/get_employees')
            .then(response => response.json())
            .then(data => {
                // Filter employees based on search query
                const filteredEmployees = data.filter(employee => {
                    const fullName = (employee.first_name + ' ' + employee.last_name).toLowerCase();
                    const designation = employee.designation.toLowerCase();
                    return fullName.includes(query) || designation.includes(query);
                });

                // Update table and grid with filtered employees
                updateEmployeeTable(filteredEmployees);
                updateEmployeeGrid(filteredEmployees);
            });
    });
});
